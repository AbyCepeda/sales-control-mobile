import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppInput } from "@/src/components/ui/AppInput";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import type {
  CreateOrderCustomerRequest,
  CreateOrderItemRequest,
  OrderStatus,
} from "@/src/features/orders/order.types";
import {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "@/src/services/ordersApi";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

/**
 * Item temporal usado solo en pantalla.
 *
 * Para qué sirve:
 * - Permite capturar artículos antes de guardar el pedido.
 *
 * Beneficio:
 * - El backend recibirá datos limpios por SKU.
 */
type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Cliente temporal capturado dentro del pedido.
 *
 * Para qué sirve:
 * - Guardar temporalmente los datos del cliente antes de crear el pedido.
 *
 * Beneficio:
 * - No dependemos de una lista de clientes existentes.
 */
type DraftCustomerOrder = {
  localId: string;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};

/**
 * Traduce los estados del backend a texto legible.
 *
 * Para qué sirve:
 * - Usamos este texto en alerts.
 *
 * Beneficio:
 * - El usuario ve "Pagado" en lugar de "PAID".
 */
function getStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

/**
 * Genera IDs locales para listas temporales.
 *
 * Beneficio:
 * - React puede renderizar clientes/artículos sin errores de key.
 */
function createLocalId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Convierte texto a número seguro.
 *
 * Beneficio:
 * - Evita mandar NaN al backend.
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
 * - Inicializa un artículo nuevo en el formulario.
 *
 * Beneficio:
 * - Todo artículo nuevo empieza como pendiente de pago.
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
 * Crea un cliente vacío dentro del pedido.
 *
 * Beneficio:
 * - El formulario inicia listo para capturar cliente y artículo.
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
 * Pantalla principal de pedidos.
 *
 * Para qué sirve:
 * - Lista pedidos existentes.
 * - Permite crear pedidos nuevos.
 * - Permite cambiar estado rápido.
 * - Permite abrir detalle para editar pedido completo.
 *
 * Beneficio:
 * - Esta pantalla queda como resumen y alta rápida.
 * - La edición pesada vive en /orders/:id.
 */
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
  const [draftCustomers, setDraftCustomers] = useState<DraftCustomerOrder[]>([
    createEmptyCustomerOrder(),
  ]);

  const orders = ordersData?.data ?? [];

  /**
   * Calcula el total temporal antes de guardar.
   *
   * Beneficio:
   * - El vendedor ve el total acumulado en tiempo real.
   * - El backend vuelve a calcular por seguridad.
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
   * Abre o cierra el formulario de nuevo pedido.
   */
  function handleToggleForm() {
    setShowForm((current) => {
      const nextValue = !current;

      if (nextValue && !draftCustomers.length) {
        setDraftCustomers([createEmptyCustomerOrder()]);
      }

      return nextValue;
    });
  }

  /**
   * Agrega otro cliente al pedido.
   */
  function handleAddCustomer() {
    setDraftCustomers((current) => [...current, createEmptyCustomerOrder()]);
  }

  /**
   * Quita un cliente del pedido temporal.
   *
   * Nota:
   * - En creación rápida no confirmamos todavía para no hacer pesado el flujo.
   * - En edición completa ya tenemos confirmación.
   */
  function handleRemoveCustomer(customerLocalId: string) {
    setDraftCustomers((current) =>
      current.filter(
        (customerOrder) => customerOrder.localId !== customerLocalId,
      ),
    );
  }

  /**
   * Actualiza datos del cliente capturado.
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
   * Agrega artículo a un cliente.
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
   * Quita artículo de un cliente.
   */
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

  /**
   * Cambia el estado de pago de un artículo.
   *
   * Para qué sirve:
   * - Permite marcar un artículo individual como pagado o pendiente.
   *
   * Beneficio:
   * - No necesitamos marcar todo el pedido como pagado.
   * - Un pedido puede tener artículos pagados y otros pendientes.
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
   * Valida el pedido antes de mandarlo al backend.
   */
  function validateDraftOrder() {
    if (!draftCustomers.length) {
      Alert.alert(
        "Agrega clientes",
        "El pedido debe tener al menos un cliente.",
      );
      return false;
    }

    for (const customerOrder of draftCustomers) {
      if (!customerOrder.name.trim()) {
        Alert.alert("Nombre requerido", "Cada cliente debe tener un nombre.");
        return false;
      }

      if (!customerOrder.items.length) {
        Alert.alert(
          "Faltan artículos",
          `Agrega al menos un artículo para ${customerOrder.name}.`,
        );
        return false;
      }

      for (const item of customerOrder.items) {
        if (!item.sku.trim()) {
          Alert.alert("SKU requerido", "Todos los artículos necesitan SKU.");
          return false;
        }

        if (!item.name.trim()) {
          Alert.alert(
            "Nombre requerido",
            "Todos los artículos necesitan nombre.",
          );
          return false;
        }

        if (item.quantity <= 0) {
          Alert.alert(
            "Cantidad inválida",
            "La cantidad debe ser mayor a cero.",
          );
          return false;
        }

        if (item.unitPrice <= 0) {
          Alert.alert(
            "Precio inválido",
            "El precio unitario debe ser mayor a cero.",
          );
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Guarda el pedido general.
   */
  async function handleSaveOrder() {
    try {
      if (!validateDraftOrder()) {
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
             * Guardamos si este artículo individual ya fue pagado.
             *
             * Para qué sirve:
             * - El backend conserva el estado de pago por artículo.
             *
             * Beneficio:
             * - Al abrir el pedido después, se mantiene como Pagado/Pendiente.
             */
            isPaid: item.isPaid ?? false,
          })),
        }),
      );

      const payload = {
        notes: orderNotes.trim() || null,
        deliveryDate: null,
        customers: customersPayload,
      };

      //console.log("CREATE_ORDER_PAYLOAD:", JSON.stringify(payload, null, 2));

      await createOrder(payload).unwrap();

      setOrderNotes("");
      setDraftCustomers([createEmptyCustomerOrder()]);
      setShowForm(false);

      Alert.alert("Pedido creado", "El pedido se guardó correctamente.");
    } catch (error: any) {
      //console.error("CREATE_ORDER_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al crear pedido",
        error?.data?.message ?? "No se pudo crear el pedido.",
      );
    }
  }

  /**
   * Actualiza estado básico de un pedido.
   *
   * Para qué sirve:
   * - Cambiar estado desde la lista sin entrar al detalle.
   */
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
        `El pedido ahora está: ${getStatusLabel(status)}.`,
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
                  <View
                    key={customerOrder.localId}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-lg font-extrabold text-slate-950">
                          Cliente #{customerIndex + 1}
                        </Text>

                        <Text className="mt-1 text-sm font-bold text-emerald-700">
                          Total cliente: ${customerTotal.toFixed(2)}
                        </Text>
                      </View>

                      {draftCustomers.length > 1 ? (
                        <AppButton
                          title="Quitar"
                          variant="danger"
                          className="px-3 py-2"
                          textClassName="text-xs"
                          onPress={() =>
                            handleRemoveCustomer(customerOrder.localId)
                          }
                        />
                      ) : null}
                    </View>

                    <AppInput
                      className="mt-4"
                      inputClassName="bg-white"
                      placeholder="Nombre del cliente"
                      value={customerOrder.name}
                      onChangeText={(value) =>
                        handleUpdateCustomer(
                          customerOrder.localId,
                          "name",
                          value,
                        )
                      }
                    />

                    <AppInput
                      className="mt-3"
                      inputClassName="bg-white"
                      placeholder="Teléfono del cliente"
                      keyboardType="phone-pad"
                      value={customerOrder.phone}
                      onChangeText={(value) =>
                        handleUpdateCustomer(
                          customerOrder.localId,
                          "phone",
                          value,
                        )
                      }
                    />

                    <AppInput
                      className="mt-3"
                      inputClassName="bg-white"
                      placeholder="Notas del cliente"
                      value={customerOrder.notes}
                      onChangeText={(value) =>
                        handleUpdateCustomer(
                          customerOrder.localId,
                          "notes",
                          value,
                        )
                      }
                      multiline
                    />

                    <Text className="mt-5 text-base font-extrabold text-slate-950">
                      Artículos
                    </Text>

                    <View className="mt-3 gap-3">
                      {customerOrder.items.map((item, itemIndex) => (
                        <View
                          key={item.localId}
                          className="rounded-xl bg-white p-4"
                        >
                          <View className="gap-3">
                            <View className="flex-row items-center justify-between gap-3">
                              <Text className="font-extrabold text-slate-950">
                                Artículo #{itemIndex + 1}
                              </Text>

                              {customerOrder.items.length > 1 ? (
                                <AppButton
                                  title="Quitar"
                                  variant="danger"
                                  className="px-3 py-2"
                                  textClassName="text-xs"
                                  onPress={() =>
                                    handleRemoveItem(
                                      customerOrder.localId,
                                      item.localId,
                                    )
                                  }
                                />
                              ) : null}
                            </View>

                            <AppButton
                              title={
                                item.isPaid ? "Pagado" : "Pendiente de pago"
                              }
                              variant={item.isPaid ? "success" : "outline"}
                              className="self-start px-3 py-2"
                              textClassName="text-xs"
                              onPress={() =>
                                handleToggleItemPaid(
                                  customerOrder.localId,
                                  item.localId,
                                )
                              }
                            />
                          </View>

                          <AppInput
                            className="mt-3"
                            placeholder="SKU / Código"
                            value={item.sku}
                            onChangeText={(value) =>
                              handleUpdateItem(
                                customerOrder.localId,
                                item.localId,
                                "sku",
                                value,
                              )
                            }
                          />

                          <AppInput
                            className="mt-3"
                            placeholder="Nombre del artículo"
                            value={item.name}
                            onChangeText={(value) =>
                              handleUpdateItem(
                                customerOrder.localId,
                                item.localId,
                                "name",
                                value,
                              )
                            }
                          />

                          <AppInput
                            className="mt-3"
                            placeholder="Descripción"
                            value={item.description ?? ""}
                            onChangeText={(value) =>
                              handleUpdateItem(
                                customerOrder.localId,
                                item.localId,
                                "description",
                                value,
                              )
                            }
                          />

                          <View className="mt-3 flex-row gap-3">
                            <AppInput
                              className="flex-1"
                              label="Cantidad"
                              placeholder="Ej. 1"
                              keyboardType="numeric"
                              value={String(item.quantity)}
                              onChangeText={(value) =>
                                handleUpdateItem(
                                  customerOrder.localId,
                                  item.localId,
                                  "quantity",
                                  value,
                                )
                              }
                            />

                            <AppInput
                              className="flex-1"
                              label="Precio"
                              placeholder="Ej. 250"
                              keyboardType="numeric"
                              value={String(item.unitPrice)}
                              onChangeText={(value) =>
                                handleUpdateItem(
                                  customerOrder.localId,
                                  item.localId,
                                  "unitPrice",
                                  value,
                                )
                              }
                            />
                          </View>

                          <Text className="mt-3 text-right text-sm font-bold text-slate-700">
                            Subtotal: $
                            {(item.quantity * item.unitPrice).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <AppButton
                      title="+ Agregar artículo"
                      variant="secondary"
                      className="mt-4"
                      onPress={() => handleAddItem(customerOrder.localId)}
                    />
                  </View>
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

        {isLoadingOrders ? (
          <AppCard className="mt-8 items-center p-8">
            <ActivityIndicator />

            <Text className="mt-3 text-slate-500">Cargando pedidos...</Text>
          </AppCard>
        ) : ordersError ? (
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
            {orders.length ? (
              orders.map((order) => {
                const isThisOrderUpdating =
                  isUpdatingOrder && updatingOrderId === order.id;

                return (
                  <AppCard key={order.id}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="text-xl font-extrabold text-slate-950">
                          Pedido #{order.id}
                        </Text>

                        <Text className="mt-1 text-sm text-slate-500">
                          Clientes: {order.customerOrders.length}
                        </Text>

                        <View className="mt-2">
                          <StatusBadge status={order.status} />
                        </View>
                      </View>

                      <Text className="text-lg font-extrabold text-emerald-700">
                        ${Number(order.total).toFixed(2)}
                      </Text>
                    </View>

                    <AppButton
                      title="Ver / Editar"
                      className="mt-4"
                      onPress={() =>
                        router.push({
                          pathname: "/orders/[id]" as any,
                          params: {
                            id: String(order.id),
                          },
                        })
                      }
                    />

                    <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <OrderStatusSelector
                        label="Cambiar estado rápido"
                        value={order.status}
                        disabled={isThisOrderUpdating}
                        onChange={(statusValue) =>
                          handleUpdateOrderStatus(order.id, statusValue)
                        }
                      />

                      {isThisOrderUpdating ? (
                        <Text className="mt-3 text-xs text-slate-500">
                          Actualizando estado...
                        </Text>
                      ) : null}
                    </View>

                    <View className="mt-4 gap-3">
                      {order.customerOrders.map((customerOrder) => {
                        const paidItemsCount = customerOrder.items.filter(
                          (item) => item.isPaid,
                        ).length;

                        return (
                          <View
                            key={customerOrder.id}
                            className="rounded-xl bg-slate-50 p-4"
                          >
                            <Text className="font-extrabold text-slate-950">
                              {customerOrder.customer.name}
                            </Text>

                            <Text className="mt-1 text-sm text-slate-500">
                              {customerOrder.customer.phone ?? "Sin teléfono"}
                            </Text>

                            <Text className="mt-1 text-sm text-slate-500">
                              Artículos: {customerOrder.items.length}
                            </Text>

                            <Text className="mt-1 text-sm font-bold text-emerald-700">
                              Pagados: {paidItemsCount}/
                              {customerOrder.items.length}
                            </Text>

                            <Text className="mt-1 text-sm font-bold text-slate-700">
                              Total cliente: $
                              {Number(customerOrder.total).toFixed(2)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </AppCard>
                );
              })
            ) : (
              <AppCard>
                <Text className="text-center text-slate-500">
                  Todavía no hay pedidos registrados.
                </Text>
              </AppCard>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
