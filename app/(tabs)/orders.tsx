import { OrderCustomerForm } from "@/src/components/orders/OrderCustomerForm";
import { OrderSummaryCard } from "@/src/components/orders/OrderSummaryCard";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import type {
  CreateOrderItemRequest,
  OrderStatus,
} from "@/src/features/orders/order.types";
import {
  getOrdersCache,
  saveOrdersCache,
  type CachedOrdersResponse,
} from "@/src/features/orders/orderCache.service";
import type { DraftCustomerOrder } from "@/src/features/orders/orderDraft.types";
import {
  buildOrderCustomersPayload,
  createEmptyCustomerOrder,
  createEmptyItem,
  parseNumber,
  validateDraftOrder,
} from "@/src/features/orders/orderDraft.utils";
import { getOrderStatusLabel } from "@/src/features/orders/orderStatus.utils";
import { addSyncQueueItem } from "@/src/features/sync/syncQueue.service";
import {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "@/src/services/ordersApi";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

export default function OrdersScreen() {
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch,
  } = useGetOrdersQuery();

  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();

  const [updateOrder, { isLoading: isUpdatingOrder }] =
    useUpdateOrderMutation();

  const [showForm, setShowForm] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  const [expandedItemLocalId, setExpandedItemLocalId] = useState<string | null>(
    null,
  );

  const [expandedCustomerLocalId, setExpandedCustomerLocalId] = useState<
    string | null
  >(null);

  const [draftCustomers, setDraftCustomers] = useState<DraftCustomerOrder[]>([
    createEmptyCustomerOrder(),
  ]);

  /**
   * Guarda los pedidos de caché local.
   *
   * Para qué sirve:
   * - Tener datos disponibles si falla la API.
   *
   * Beneficio:
   * - Puedes ver últimos pedidos aunque no haya internet.
   */
  const [cachedOrdersData, setCachedOrdersData] =
    useState<CachedOrdersResponse | null>(null);

  const isShowingOfflineCache = Boolean(ordersError && cachedOrdersData);

  const orders = ordersData?.data ?? cachedOrdersData?.data ?? [];

  /**
   * Si la API responde bien, guardamos esa respuesta en caché local.
   */
  useEffect(() => {
    if (!ordersData) {
      return;
    }

    /**
     * Guardamos ordersData en una constante local.
     *
     * Para qué sirve:
     * - TypeScript entiende que aquí ya no es undefined.
     *
     * Beneficio:
     * - Evitamos el error:
     *   ApiResponse<Order[]> | undefined no es asignable.
     */
    const currentOrdersData = ordersData;

    async function cacheOrders() {
      try {
        await saveOrdersCache(currentOrdersData);
        setCachedOrdersData(currentOrdersData);
      } catch (error) {
        console.error("SAVE_ORDERS_CACHE_ERROR:", error);
      }
    }

    cacheOrders();
  }, [ordersData]);

  /**
   * Si la API falla, intentamos cargar pedidos desde caché.
   */
  useEffect(() => {
    if (!ordersError) {
      return;
    }

    async function loadCachedOrders() {
      try {
        const cachedOrders = await getOrdersCache();

        if (cachedOrders) {
          setCachedOrdersData(cachedOrders);
        }
      } catch (error) {
        console.error("GET_ORDERS_CACHE_ERROR:", error);
      }
    }

    loadCachedOrders();
  }, [ordersError]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchText);

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : order.status === statusFilter;

      const customerNames = order.customerOrders
        .map((customerOrder) => customerOrder.customer.name)
        .join(" ");

      const searchableText = normalizeSearchText(
        `${order.id} ${customerNames}`,
      );

      const matchesSearch = normalizedSearch
        ? searchableText.includes(normalizedSearch)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchText, statusFilter]);

  const draftTotal = useMemo(() => {
    return draftCustomers.reduce((orderTotal, customerOrder) => {
      const customerTotal = customerOrder.items.reduce((itemsTotal, item) => {
        return itemsTotal + item.quantity * item.unitPrice;
      }, 0);

      return orderTotal + customerTotal;
    }, 0);
  }, [draftCustomers]);

  function handleToggleForm() {
    setShowForm((current) => {
      const nextValue = !current;

      if (nextValue && !draftCustomers.length) {
        setDraftCustomers([createEmptyCustomerOrder()]);
      }

      return nextValue;
    });
  }

  function handleAddCustomer() {
    const newCustomer = createEmptyCustomerOrder();

    setExpandedCustomerLocalId(newCustomer.localId);
    setExpandedItemLocalId(newCustomer.items[0]?.localId ?? null);

    setDraftCustomers((current) => [...current, newCustomer]);
  }

  function handleRemoveCustomer(customerLocalId: string) {
    setDraftCustomers((current) =>
      current.filter(
        (customerOrder) => customerOrder.localId !== customerLocalId,
      ),
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

  async function handleSaveOrder() {
    const validation = validateDraftOrder(draftCustomers);

    if (!validation.isValid) {
      Alert.alert(validation.title, validation.message);
      return;
    }

    const customersPayload = buildOrderCustomersPayload(draftCustomers);

    const payload = {
      notes: orderNotes.trim() || null,
      deliveryDate: null,
      customers: customersPayload,
    };

    try {
      await createOrder(payload).unwrap();

      setOrderNotes("");
      setExpandedCustomerLocalId(null);
      setExpandedItemLocalId(null);
      setDraftCustomers([createEmptyCustomerOrder()]);
      setShowForm(false);

      Alert.alert("Pedido creado", "El pedido se guardó correctamente.");
    } catch (error: any) {
      console.error("CREATE_ORDER_ERROR:", JSON.stringify(error, null, 2));

      await addSyncQueueItem("CREATE_ORDER", payload);

      setOrderNotes("");
      setExpandedCustomerLocalId(null);
      setExpandedItemLocalId(null);
      setDraftCustomers([createEmptyCustomerOrder()]);
      setShowForm(false);

      Alert.alert(
        "Pedido guardado offline",
        "No se pudo conectar con el servidor, pero el pedido quedó guardado en este dispositivo para sincronizarlo después.",
      );
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: OrderStatus) {
    try {
      setUpdatingOrderId(orderId);

      await updateOrder({
        id: orderId,
        body: {
          status,
        },
      }).unwrap();

      Alert.alert(
        "Pedido actualizado",
        `El pedido ahora está: ${getOrderStatusLabel(status)}.`,
      );
    } catch (error: any) {
      console.error("UPDATE_ORDER_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al actualizar",
        error?.data?.message ?? "No se pudo actualizar el pedido.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-slate-950">
              Pedidos
            </Text>

            <Text className="mt-1 text-base text-slate-500">
              Captura pedidos por cliente y artículo.
            </Text>
          </View>

          <AppButton
            title={showForm ? "Cerrar" : "+ Nuevo"}
            onPress={handleToggleForm}
            className="px-4 py-3"
            textClassName="text-sm"
          />
        </View>

        {showForm ? (
          <AppCard className="mt-6">
            <Text className="text-xl font-extrabold text-slate-950">
              Nuevo pedido
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Captura cliente y artículos manualmente.
            </Text>

            <AppInput
              className="mt-5"
              placeholder="Notas del pedido general"
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
            />

            <View className="mt-6 gap-5">
              {draftCustomers.map((customerOrder, customerIndex) => {
                const customerTotal = customerOrder.items.reduce(
                  (total, item) => total + item.quantity * item.unitPrice,
                  0,
                );

                return (
                  <OrderCustomerForm
                    key={customerOrder.localId}
                    customerOrder={customerOrder}
                    customerIndex={customerIndex}
                    customersCount={draftCustomers.length}
                    customerTotal={customerTotal}
                    expandedCustomerLocalId={expandedCustomerLocalId}
                    expandedItemLocalId={expandedItemLocalId}
                    onRemoveCustomer={handleRemoveCustomer}
                    onUpdateCustomer={handleUpdateCustomer}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onToggleItemPaid={handleToggleItemPaid}
                    onUpdateItem={handleUpdateItem}
                  />
                );
              })}
            </View>

            <AppButton
              title="+ Agregar otro cliente"
              variant="outline"
              className="mt-5 py-4"
              onPress={handleAddCustomer}
            />

            <View className="mt-6 rounded-2xl bg-slate-950 p-5">
              <Text className="text-sm font-bold text-slate-300">
                Total del pedido
              </Text>

              <Text className="mt-1 text-3xl font-extrabold text-white">
                ${draftTotal.toFixed(2)}
              </Text>
            </View>

            <AppButton
              title="Guardar pedido"
              variant="success"
              className="mt-5 py-4"
              onPress={handleSaveOrder}
              isLoading={isCreatingOrder}
            />
          </AppCard>
        ) : null}

        <AppCard className="mt-6">
          <Text className="text-lg font-extrabold text-slate-950">
            Buscar pedidos
          </Text>

          <AppInput
            className="mt-4"
            placeholder="Buscar por pedido o cliente"
            value={searchText}
            onChangeText={setSearchText}
          />

          <Text className="mt-5 font-extrabold text-slate-950">
            Filtrar por estado
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { label: "Todos", value: "ALL" as const },
              { label: "Pendientes", value: "PENDING" as const },
              { label: "Pagados", value: "PAID" as const },
              { label: "Entregados", value: "DELIVERED" as const },
              { label: "Cancelados", value: "CANCELLED" as const },
            ].map((option) => {
              const isSelected = statusFilter === option.value;

              return (
                <AppButton
                  key={option.value}
                  title={option.label}
                  variant={isSelected ? "primary" : "outline"}
                  className="px-3 py-2"
                  textClassName="text-xs"
                  onPress={() => setStatusFilter(option.value)}
                />
              );
            })}
          </View>

          <Text className="mt-4 text-sm text-slate-500">
            Mostrando {filteredOrders.length} de {orders.length} pedidos.
          </Text>
        </AppCard>

        {isShowingOfflineCache ? (
          <AppCard className="mt-6 border border-amber-300 bg-amber-50">
            <Text className="text-base font-extrabold text-amber-800">
              Modo offline
            </Text>

            <Text className="mt-1 text-sm text-amber-700">
              No se pudo conectar con el servidor. Estás viendo los últimos
              pedidos guardados en este dispositivo.
            </Text>
          </AppCard>
        ) : null}

        {isLoadingOrders ? (
          <AppCard className="mt-8 items-center p-8">
            <ActivityIndicator />

            <Text className="mt-3 text-slate-500">Cargando pedidos...</Text>
          </AppCard>
        ) : ordersError && !cachedOrdersData ? (
          <AppCard className="mt-8">
            <Text className="text-xl font-extrabold text-red-600">
              No se pudieron cargar los pedidos
            </Text>

            <Text className="mt-2 text-slate-500">
              Revisa que el backend esté encendido y que tu sesión siga activa.
            </Text>

            <AppButton
              title="Reintentar"
              className="mt-5 py-4"
              onPress={() => refetch()}
            />
          </AppCard>
        ) : (
          <View className="mt-6 gap-4">
            {filteredOrders.length ? (
              filteredOrders.map((order) => {
                const isThisOrderUpdating =
                  isUpdatingOrder && updatingOrderId === order.id;

                return (
                  <OrderSummaryCard
                    key={order.id}
                    order={order}
                    isUpdating={isThisOrderUpdating}
                    onUpdateStatus={handleUpdateOrderStatus}
                  />
                );
              })
            ) : (
              <AppCard>
                <Text className="text-center text-slate-500">
                  {orders.length
                    ? "No hay pedidos que coincidan con la búsqueda."
                    : "Todavía no hay pedidos registrados."}
                </Text>
              </AppCard>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
