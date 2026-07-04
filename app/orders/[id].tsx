import { OrderCustomerForm } from "@/src/components/orders/OrderCustomerForm";
import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import type {
  CreateOrderCustomerRequest,
  CreateOrderItemRequest,
  OrderStatus,
} from "@/src/features/orders/order.types";
import { validateDraftOrder } from "@/src/features/orders/orderDraft.utils";
import { getOrderPaymentSummary } from "@/src/features/orders/orderPayment.utils";
import {
  useGetOrderByIdQuery,
  useUpdateFullOrderMutation,
} from "@/src/services/ordersApi";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

/**
 * Artículo temporal usado solo en pantalla.
 *
 * Para qué sirve:
 * - Permite editar artículos antes de guardar el pedido.
 *
 * Beneficio:
 * - El backend no se modifica hasta que el usuario presiona "Guardar cambios".
 */
type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Cliente temporal dentro del formulario.
 *
 * Para qué sirve:
 * - Permite editar cliente, teléfono, notas y artículos.
 *
 * Beneficio:
 * - Podemos reconstruir el pedido completo antes de enviarlo al backend.
 */
type DraftCustomerOrder = {
  localId: string;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};

/**
 * Genera un ID local para listas temporales.
 *
 * Para qué sirve:
 * - React necesita una key estable cuando renderizamos listas.
 *
 * Beneficio:
 * - Evita errores visuales al agregar o quitar clientes/artículos.
 */
function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Convierte texto a número de forma segura.
 *
 * Para qué sirve:
 * - Los inputs de React Native trabajan con strings.
 *
 * Beneficio:
 * - Evitamos mandar NaN al backend.
 */
function parseNumber(value: string) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * Crea un artículo vacío.
 *
 * Para qué sirve:
 * - Inicializa un artículo nuevo dentro del formulario de edición.
 *
 * Beneficio:
 * - Todo artículo nuevo inicia como pendiente de pago.
 */
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

/**
 * Crea un cliente vacío con un artículo inicial.
 *
 * Para qué sirve:
 * - Permite agregar clientes nuevos al pedido.
 *
 * Beneficio:
 * - El usuario puede capturar rápido cliente + artículo.
 */
function createEmptyCustomerOrder(): DraftCustomerOrder {
  return {
    localId: createLocalId(),
    name: "",
    phone: "",
    notes: "",
    items: [createEmptyItem()],
  };
}

/**
 * Pantalla detalle de pedido.
 *
 * Para qué sirve:
 * - Permite abrir un pedido específico.
 * - Permite editar clientes y artículos.
 * - Permite agregar más clientes o más artículos.
 * - Permite marcar artículos individuales como pagados.
 *
 * Beneficio:
 * - La pantalla principal queda limpia.
 * - Toda la edición pesada vive en el detalle del pedido.
 */
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
  const [draftCustomers, setDraftCustomers] = useState<DraftCustomerOrder[]>(
    [],
  );

  const order = orderData?.data;

  /**
   * Carga el pedido recibido del backend al formulario editable.
   *
   * Para qué sirve:
   * - Convierte datos reales en datos temporales editables.
   *
   * Beneficio:
   * - El usuario puede modificar el pedido sin tocar la base de datos
   *   hasta presionar "Guardar cambios".
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

          /**
           * Cargamos el estado de pago guardado en backend.
           *
           * Para qué sirve:
           * - Si el artículo ya estaba pagado, se muestra así al abrir el pedido.
           *
           * Beneficio:
           * - No se pierde el estado Pagado/Pendiente al editar.
           */
          isPaid: item.isPaid ?? false,
        })),
      }),
    );

    setDraftCustomers(
      mappedCustomers.length ? mappedCustomers : [createEmptyCustomerOrder()],
    );
  }, [order]);

  /**
   * Calcula el total general temporal.
   *
   * Para qué sirve:
   * - Muestra el total antes de guardar.
   *
   * Beneficio:
   * - El usuario ve cambios en tiempo real.
   * - El backend recalcula otra vez por seguridad.
   */
  const draftTotal = useMemo(() => {
    return draftCustomers.reduce((orderTotal, customerOrder) => {
      const customerTotal = customerOrder.items.reduce((itemsTotal, item) => {
        return itemsTotal + item.quantity * item.unitPrice;
      }, 0);

      return orderTotal + customerTotal;
    }, 0);
  }, [draftCustomers]);

  /**
   * Calcula el resumen de pagos del pedido mientras se edita.
   *
   * Para qué sirve:
   * - Junta todos los artículos de todos los clientes.
   * - Calcula pagados, pendientes, total pagado y total pendiente.
   *
   * Beneficio:
   * - El vendedor ve rápido cuánto falta por cobrar sin revisar cliente por cliente.
   */
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

  /**
   * Agrega otro cliente al pedido.
   */
  function handleAddCustomer() {
    setDraftCustomers((current) => [...current, createEmptyCustomerOrder()]);
  }

  /**
   * Confirma antes de quitar un cliente del pedido.
   *
   * Para qué sirve:
   * - Evita eliminar un cliente por accidente.
   *
   * Beneficio:
   * - El usuario tiene oportunidad de cancelar antes de guardar cambios.
   */
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

  /**
   * Actualiza datos del cliente temporal.
   */
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

  /**
   * Agrega un artículo vacío a un cliente.
   */
  function handleAddItem(customerLocalId: string) {
    setDraftCustomers((current) =>
      current.map((customerOrder) =>
        customerOrder.localId === customerLocalId
          ? {
              ...customerOrder,
              items: [...customerOrder.items, createEmptyItem()],
            }
          : customerOrder,
      ),
    );
  }

  /**
   * Confirma antes de quitar un artículo del cliente.
   *
   * Para qué sirve:
   * - Evita quitar productos por error.
   *
   * Beneficio:
   * - Reduce errores al editar pedidos grandes.
   */
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

  /**
   * Cambia el estado de pago de un artículo.
   *
   * Para qué sirve:
   * - Permite marcar un artículo como pagado o pendiente desde la edición.
   *
   * Beneficio:
   * - El vendedor puede actualizar pagos parciales sin afectar todo el pedido.
   */
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

  /**
   * Actualiza un campo de un artículo.
   *
   * Para qué sirve:
   * - Permite editar SKU, nombre, descripción, cantidad y precio.
   *
   * Beneficio:
   * - El formulario mantiene los cambios antes de guardar.
   */
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

  /**
   * Guarda la edición completa.
   *
   * Para qué sirve:
   * - Manda el pedido completo al endpoint PUT /api/orders/:id/full.
   *
   * Beneficio:
   * - El backend reconstruye clientes/artículos.
   * - El backend recalcula totales.
   * - El backend conserva el estado pagado/pendiente por artículo.
   */
  async function handleSaveChanges() {
    try {
      const validation = validateDraftOrder(draftCustomers);

      if (!validation.isValid) {
        Alert.alert(validation.title, validation.message);
        return;
      }

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

            /**
             * Enviamos el estado de pago individual del artículo.
             *
             * Para qué sirve:
             * - El backend puede reconstruir el pedido conservando
             *   qué artículos están pagados.
             *
             * Beneficio:
             * - Al editar el pedido completo, no se pierde el estado Pagado/Pendiente.
             */
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

      console.log(
        "UPDATE_FULL_ORDER_PAYLOAD:",
        JSON.stringify(payload, null, 2),
      );

      await updateFullOrder({
        id: orderId,
        body: payload,
      }).unwrap();

      Alert.alert(
        "Pedido actualizado",
        "Los cambios se guardaron correctamente.",
      );

      refetch();
    } catch (error: any) {
      console.error("UPDATE_FULL_ORDER_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al guardar",
        error?.data?.message ?? "No se pudo editar el pedido.",
      );
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator />

        <Text className="mt-3 text-slate-500">Cargando pedido...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 bg-slate-100 px-5 pt-16">
        <AppButton title="Volver" onPress={() => router.back()} />

        <AppCard className="mt-6">
          <Text className="text-xl font-extrabold text-red-600">
            No se pudo cargar el pedido
          </Text>

          <Text className="mt-2 text-slate-500">
            Revisa tu conexión o que el backend esté activo.
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
