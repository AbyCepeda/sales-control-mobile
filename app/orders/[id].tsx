import { OrderCustomerForm } from "@/src/components/orders/OrderCustomerForm";
import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import type {
  CreateOrderCustomerRequest,
  CreateOrderItemRequest,
  Order,
  OrderStatus,
} from "@/src/features/orders/order.types";
import {
  getOrdersCache,
  updateCachedOrder,
} from "@/src/features/orders/orderCache.service";
import { validateDraftOrder } from "@/src/features/orders/orderDraft.utils";
import { getOrderPaymentSummary } from "@/src/features/orders/orderPayment.utils";
import { addSyncQueueItem } from "@/src/features/sync/syncQueue.service";
import {
  useGetOrderByIdQuery,
  useUpdateFullOrderMutation,
} from "@/src/services/ordersApi";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from "react-native";

type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

type DraftCustomerOrder = {
  localId: string;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseNumber(value: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

function showOfflineUpdateToast() {
  const message =
    "Cambios guardados offline. Se sincronizarán cuando vuelva internet.";

  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }

  Alert.alert("Cambios guardados offline", message);
}

function createEmptyItem(): DraftOrderItem {
  return {
    localId: createLocalId(),
    sku: "",
    name: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
    isPaid: false,
  };
}

function createEmptyCustomerOrder(): DraftCustomerOrder {
  return {
    localId: createLocalId(),
    name: "",
    phone: "",
    notes: "",
    items: [createEmptyItem()],
  };
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const orderId = Number(id);

  const {
    data: orderData,
    isLoading,
    error,
    refetch,
  } = useGetOrderByIdQuery(orderId, {
    skip: !orderId,
  });

  const [updateFullOrder, { isLoading: isSaving }] =
    useUpdateFullOrderMutation();

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [orderNotes, setOrderNotes] = useState("");
  const [expandedItemLocalId, setExpandedItemLocalId] = useState<string | null>(
    null,
  );
  const [expandedCustomerLocalId, setExpandedCustomerLocalId] = useState<
    string | null
  >(null);
  const [draftCustomers, setDraftCustomers] = useState<DraftCustomerOrder[]>(
    [],
  );

  /**
   * Pedido cargado desde caché local.
   *
   * Para qué sirve:
   * - Permite abrir el detalle aunque no haya internet.
   *
   * Beneficio:
   * - Si la API falla, usamos la última copia guardada en el dispositivo.
   */
  const [cachedOrder, setCachedOrder] = useState<Order | null>(null);

  /**
   * Indica si estamos viendo el pedido desde caché offline.
   */
  const isShowingOfflineOrder = Boolean(error && cachedOrder);

  /**
   * Pedido final usado por la pantalla.
   *
   * Prioridad:
   * 1. Pedido desde API.
   * 2. Pedido desde caché local.
   */
  const order = orderData?.data ?? cachedOrder;

  /**
   * Si falla la API del detalle, buscamos el pedido en la caché local.
   *
   * Para qué sirve:
   * - La lista de pedidos ya guarda una copia local.
   * - Podemos usar esa copia para abrir el detalle sin internet.
   *
   * Beneficio:
   * - El usuario puede consultar y editar pedidos existentes aunque no tenga red.
   */
  useEffect(() => {
    if (!error || !orderId) {
      return;
    }

    async function loadOrderFromCache() {
      try {
        const cachedOrders = await getOrdersCache();

        const foundOrder =
          cachedOrders?.data.find((cachedOrderItem) => {
            return cachedOrderItem.id === orderId;
          }) ?? null;

        setCachedOrder(foundOrder);
      } catch (cacheError) {
        console.log("GET_CACHED_ORDER_DETAIL_ERROR:", cacheError);
      }
    }

    loadOrderFromCache();
  }, [error, orderId]);

  /**
   * Carga el pedido recibido del backend o caché al formulario editable.
   */
  useEffect(() => {
    if (!order) {
      return;
    }

    setStatus(order.status);
    setOrderNotes(order.notes ?? "");

    const mappedCustomers: DraftCustomerOrder[] = order.customerOrders.map(
      (customerOrder) => ({
        localId: createLocalId(),
        name: customerOrder.customer.name,
        phone: customerOrder.customer.phone ?? "",
        notes: customerOrder.notes ?? customerOrder.customer.notes ?? "",
        items: customerOrder.items.map((item) => ({
          localId: createLocalId(),
          sku: item.skuSnapshot,
          name: item.nameSnapshot,
          description: item.descriptionSnapshot ?? "",
          quantity: item.quantity,
          unitPrice: Number(item.unitPriceSnapshot),
          isPaid: item.isPaid ?? false,
        })),
      }),
    );

    setDraftCustomers(
      mappedCustomers.length ? mappedCustomers : [createEmptyCustomerOrder()],
    );
  }, [order]);

  const draftTotal = useMemo(() => {
    return draftCustomers.reduce((orderTotal, customerOrder) => {
      const customerTotal = customerOrder.items.reduce((itemsTotal, item) => {
        return itemsTotal + item.quantity * item.unitPrice;
      }, 0);

      return orderTotal + customerTotal;
    }, 0);
  }, [draftCustomers]);

  const draftPaymentSummary = useMemo(() => {
    const allItems = draftCustomers.flatMap((customerOrder) =>
      customerOrder.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        isPaid: item.isPaid,
      })),
    );

    return getOrderPaymentSummary(allItems);
  }, [draftCustomers]);

  function handleAddCustomer() {
    const newCustomer = createEmptyCustomerOrder();

    setExpandedCustomerLocalId(newCustomer.localId);
    setExpandedItemLocalId(newCustomer.items[0]?.localId ?? null);

    setDraftCustomers((current) => [...current, newCustomer]);
  }

  function handleRemoveCustomer(customerLocalId: string) {
    Alert.alert(
      "Quitar cliente",
      "¿Seguro que quieres quitar este cliente del pedido?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            setDraftCustomers((current) =>
              current.filter(
                (customerOrder) => customerOrder.localId !== customerLocalId,
              ),
            );
          },
        },
      ],
    );
  }

  function handleUpdateCustomer(
    customerLocalId: string,
    field: "name" | "phone" | "notes",
    value: string,
  ) {
    setDraftCustomers((current) =>
      current.map((customerOrder) =>
        customerOrder.localId === customerLocalId
          ? {
              ...customerOrder,
              [field]: value,
            }
          : customerOrder,
      ),
    );
  }

  function handleAddItem(customerLocalId: string) {
    const newItem = createEmptyItem();

    setExpandedItemLocalId(newItem.localId);

    setDraftCustomers((current) =>
      current.map((customerOrder) =>
        customerOrder.localId === customerLocalId
          ? {
              ...customerOrder,
              items: [...customerOrder.items, newItem],
            }
          : customerOrder,
      ),
    );
  }

  function handleRemoveItem(customerLocalId: string, itemLocalId: string) {
    Alert.alert(
      "Quitar artículo",
      "¿Seguro que quieres quitar este artículo del pedido?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            setDraftCustomers((current) =>
              current.map((customerOrder) =>
                customerOrder.localId === customerLocalId
                  ? {
                      ...customerOrder,
                      items: customerOrder.items.filter(
                        (item) => item.localId !== itemLocalId,
                      ),
                    }
                  : customerOrder,
              ),
            );
          },
        },
      ],
    );
  }

  function handleToggleItemPaid(customerLocalId: string, itemLocalId: string) {
    setDraftCustomers((current) =>
      current.map((customerOrder) =>
        customerOrder.localId === customerLocalId
          ? {
              ...customerOrder,
              items: customerOrder.items.map((item) =>
                item.localId === itemLocalId
                  ? {
                      ...item,
                      isPaid: !(item.isPaid ?? false),
                    }
                  : item,
              ),
            }
          : customerOrder,
      ),
    );
  }

  function handleUpdateItem(
    customerLocalId: string,
    itemLocalId: string,
    field: keyof CreateOrderItemRequest,
    value: string,
  ) {
    setDraftCustomers((current) =>
      current.map((customerOrder) =>
        customerOrder.localId === customerLocalId
          ? {
              ...customerOrder,
              items: customerOrder.items.map((item) => {
                if (item.localId !== itemLocalId) {
                  return item;
                }

                if (field === "quantity") {
                  return {
                    ...item,
                    quantity: parseNumber(value),
                  };
                }

                if (field === "unitPrice") {
                  return {
                    ...item,
                    unitPrice: parseNumber(value),
                  };
                }

                return {
                  ...item,
                  [field]: value,
                };
              }),
            }
          : customerOrder,
      ),
    );
  }

  async function handleSaveChanges() {
    const validation = validateDraftOrder(draftCustomers);

    if (!validation.isValid) {
      Alert.alert(validation.title, validation.message);
      return;
    }

    /**
     * Armamos el payload antes del try.
     *
     * Para qué sirve:
     * - Si el PUT falla, el catch también puede usar este mismo payload.
     *
     * Beneficio:
     * - Podemos guardar la edición offline en sync_queue como UPDATE_ORDER.
     */
    const customersPayload: CreateOrderCustomerRequest[] = draftCustomers.map(
      (customerOrder) => ({
        name: customerOrder.name.trim(),
        phone: customerOrder.phone.trim() || null,
        notes: customerOrder.notes.trim() || null,
        items: customerOrder.items.map((item) => ({
          sku: item.sku.trim(),
          name: item.name.trim(),
          description: item.description?.trim() || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isPaid: item.isPaid ?? false,
        })),
      }),
    );

    const payload = {
      status,
      notes: orderNotes.trim() || null,
      deliveryDate: order?.deliveryDate ?? null,
      customers: customersPayload,
    };

    try {
      await updateFullOrder({
        id: orderId,
        body: payload,
      }).unwrap();

      Alert.alert(
        "Pedido actualizado",
        "Los cambios se guardaron correctamente.",
      );

      refetch();
    } catch {
      await addSyncQueueItem("UPDATE_ORDER", {
        id: orderId,
        body: payload,
      });

      await updateCachedOrder(orderId, payload);

      showOfflineUpdateToast();

      router.back();
    }
  }

  if (isLoading && !cachedOrder) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator />

        <Text className="mt-3 text-slate-500">Cargando pedido...</Text>
      </View>
    );
  }

  if ((error && !cachedOrder) || !order) {
    return (
      <View className="flex-1 bg-slate-100 px-5 pt-16">
        <AppButton title="Volver" onPress={() => router.back()} />

        <AppCard className="mt-6">
          <Text className="text-xl font-extrabold text-red-600">
            No se pudo cargar el pedido
          </Text>

          <Text className="mt-2 text-slate-500">
            Revisa tu conexión o que el pedido ya exista en la caché local.
          </Text>

          <AppButton
            title="Reintentar"
            className="mt-5"
            onPress={() => refetch()}
          />
        </AppCard>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <AppButton title="Volver" onPress={() => router.back()} />

        {isShowingOfflineOrder ? (
          <AppCard className="mt-6 border border-amber-300 bg-amber-50">
            <Text className="text-base font-extrabold text-amber-800">
              Modo offline
            </Text>

            <Text className="mt-1 text-sm text-amber-700">
              Estás viendo una copia guardada del pedido. Puedes editarlo y los
              cambios se sincronizarán cuando vuelva internet.
            </Text>
          </AppCard>
        ) : null}

        <AppCard className="mt-6">
          <Text className="text-2xl font-extrabold text-slate-950">
            Editar pedido #{order.id}
          </Text>

          <Text className="mt-1 text-sm text-slate-500">
            Agrega clientes, artículos o corrige cantidades.
          </Text>

          <View className="mt-5 rounded-2xl bg-slate-950 p-5">
            <Text className="text-sm font-bold text-slate-300">
              Total actualizado
            </Text>

            <Text className="mt-1 text-3xl font-extrabold text-white">
              ${draftTotal.toFixed(2)}
            </Text>

            <View className="mt-4 rounded-2xl bg-white/10 p-4">
              <Text className="text-sm font-bold text-emerald-300">
                Pagado: ${draftPaymentSummary.paidTotal.toFixed(2)}
              </Text>

              <Text className="mt-1 text-sm font-bold text-orange-300">
                Pendiente: ${draftPaymentSummary.pendingTotal.toFixed(2)}
              </Text>

              <Text className="mt-1 text-sm font-bold text-slate-200">
                Artículos pagados: {draftPaymentSummary.paidItemsCount}/
                {draftPaymentSummary.totalItems}
              </Text>

              <Text className="mt-1 text-sm font-bold text-slate-200">
                Artículos pendientes: {draftPaymentSummary.pendingItemsCount}
              </Text>
            </View>
          </View>

          <OrderStatusSelector
            className="mt-5"
            value={status}
            onChange={setStatus}
          />

          <AppInput
            className="mt-5"
            placeholder="Notas del pedido"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
          />
        </AppCard>

        <View className="mt-6 gap-5">
          {draftCustomers.map((customerOrder, customerIndex) => {
            const customerTotal = customerOrder.items.reduce(
              (total, item) => total + item.quantity * item.unitPrice,
              0,
            );

            return (
              <AppCard key={customerOrder.localId}>
                <OrderCustomerForm
                  customerOrder={customerOrder}
                  customerIndex={customerIndex}
                  customersCount={draftCustomers.length}
                  customerTotal={customerTotal}
                  itemInputClassName="bg-white"
                  defaultExpanded={customerIndex === 0}
                  expandedCustomerLocalId={expandedCustomerLocalId}
                  expandedItemLocalId={expandedItemLocalId}
                  onRemoveCustomer={handleRemoveCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onToggleItemPaid={handleToggleItemPaid}
                  onUpdateItem={handleUpdateItem}
                />
              </AppCard>
            );
          })}
        </View>

        <AppButton
          title="+ Agregar otro cliente"
          variant="outline"
          className="mt-5 py-4"
          onPress={handleAddCustomer}
        />

        <AppButton
          title="Guardar cambios"
          variant="success"
          className="mt-6 py-4"
          onPress={handleSaveChanges}
          isLoading={isSaving}
        />
      </View>
    </ScrollView>
  );
}
