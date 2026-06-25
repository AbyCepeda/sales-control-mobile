import type {
  CreateOrderCustomerRequest,
  CreateOrderItemRequest,
  OrderStatus,
} from "@/src/features/orders/order.types";
import {
  useGetOrderByIdQuery,
  useUpdateFullOrderMutation,
} from "@/src/services/ordersApi";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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

const orderStatusOptions: {
  label: string;
  value: OrderStatus;
}[] = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Pagado", value: "PAID" },
  { label: "Entregado", value: "DELIVERED" },
  { label: "Cancelado", value: "CANCELLED" },
];

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

function createEmptyItem(): DraftOrderItem {
  return {
    localId: createLocalId(),
    sku: "",
    name: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
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

/**
 * Pantalla detalle de pedido.
 *
 * Para qué sirve:
 * - Permite abrir un pedido específico.
 * - Permite editar clientes y artículos.
 * - Permite agregar más clientes o más artículos.
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
   * Beneficio:
   * - Convertimos datos reales en datos temporales editables.
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
        })),
      }),
    );

    setDraftCustomers(
      mappedCustomers.length ? mappedCustomers : [createEmptyCustomerOrder()],
    );
  }, [order]);

  /**
   * Calcula total general temporal.
   *
   * Beneficio:
   * - El usuario ve el total antes de guardar.
   * - El backend recalcula de nuevo para seguridad.
   */
  const draftTotal = useMemo(() => {
    return draftCustomers.reduce((orderTotal, customerOrder) => {
      const customerTotal = customerOrder.items.reduce((itemsTotal, item) => {
        return itemsTotal + item.quantity * item.unitPrice;
      }, 0);

      return orderTotal + customerTotal;
    }, 0);
  }, [draftCustomers]);

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
   * Guarda la edición completa.
   *
   * Para qué sirve:
   * - Manda el pedido completo al endpoint PUT /api/orders/:id/full.
   *
   * Beneficio:
   * - El backend reconstruye clientes/artículos y recalcula totales.
   */
  async function handleSaveChanges() {
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
        <Pressable
          className="rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-center font-bold text-white">Volver</Text>
        </Pressable>

        <View className="mt-6 rounded-3xl bg-white p-5">
          <Text className="text-xl font-extrabold text-red-600">
            No se pudo cargar el pedido
          </Text>

          <Text className="mt-2 text-slate-500">
            Revisa tu conexión o que el backend esté activo.
          </Text>

          <Pressable
            className="mt-5 rounded-xl bg-slate-950 py-4 active:opacity-80"
            onPress={() => refetch()}
          >
            <Text className="text-center font-bold text-white">Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-100">
      <View className="px-5 pb-10 pt-16">
        <Pressable
          className="rounded-xl bg-slate-950 px-4 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-center font-bold text-white">Volver</Text>
        </Pressable>

        <View className="mt-6 rounded-3xl bg-white p-5">
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
          </View>

          <Text className="mt-5 font-extrabold text-slate-950">
            Estado del pedido
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {orderStatusOptions.map((statusOption) => {
              const isSelected = status === statusOption.value;

              return (
                <Pressable
                  key={statusOption.value}
                  className={`rounded-xl px-3 py-2 active:opacity-80 ${
                    isSelected ? "bg-slate-950" : "bg-slate-100"
                  }`}
                  onPress={() => setStatus(statusOption.value)}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {statusOption.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
            placeholder="Notas del pedido"
            placeholderTextColor="#94a3b8"
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
          />
        </View>

        <View className="mt-6 gap-5">
          {draftCustomers.map((customerOrder, customerIndex) => {
            const customerTotal = customerOrder.items.reduce(
              (total, item) => total + item.quantity * item.unitPrice,
              0,
            );

            return (
              <View
                key={customerOrder.localId}
                className="rounded-3xl bg-white p-5"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-xl font-extrabold text-slate-950">
                      Cliente #{customerIndex + 1}
                    </Text>

                    <Text className="mt-1 text-sm font-bold text-emerald-700">
                      Total cliente: ${customerTotal.toFixed(2)}
                    </Text>
                  </View>

                  {draftCustomers.length > 1 ? (
                    <Pressable
                      className="rounded-lg bg-red-100 px-3 py-2 active:opacity-80"
                      onPress={() =>
                        handleRemoveCustomer(customerOrder.localId)
                      }
                    >
                      <Text className="text-xs font-bold text-red-700">
                        Quitar
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <TextInput
                  className="mt-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                  placeholder="Nombre del cliente"
                  placeholderTextColor="#94a3b8"
                  value={customerOrder.name}
                  onChangeText={(value) =>
                    handleUpdateCustomer(customerOrder.localId, "name", value)
                  }
                />

                <TextInput
                  className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                  placeholder="Teléfono"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={customerOrder.phone}
                  onChangeText={(value) =>
                    handleUpdateCustomer(customerOrder.localId, "phone", value)
                  }
                />

                <TextInput
                  className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900"
                  placeholder="Notas del cliente"
                  placeholderTextColor="#94a3b8"
                  value={customerOrder.notes}
                  onChangeText={(value) =>
                    handleUpdateCustomer(customerOrder.localId, "notes", value)
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
                      className="rounded-2xl bg-slate-50 p-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="font-extrabold text-slate-950">
                          Artículo #{itemIndex + 1}
                        </Text>

                        {customerOrder.items.length > 1 ? (
                          <Pressable
                            className="rounded-lg bg-red-100 px-3 py-2 active:opacity-80"
                            onPress={() =>
                              handleRemoveItem(
                                customerOrder.localId,
                                item.localId,
                              )
                            }
                          >
                            <Text className="text-xs font-bold text-red-700">
                              Quitar
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <TextInput
                        className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                        placeholder="SKU / Código"
                        placeholderTextColor="#94a3b8"
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

                      <TextInput
                        className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                        placeholder="Nombre del artículo"
                        placeholderTextColor="#94a3b8"
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

                      <TextInput
                        className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                        placeholder="Descripción"
                        placeholderTextColor="#94a3b8"
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
                        <TextInput
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                          placeholder="Cantidad"
                          placeholderTextColor="#94a3b8"
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

                        <TextInput
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                          placeholder="Precio"
                          placeholderTextColor="#94a3b8"
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
                        Subtotal: ${(item.quantity * item.unitPrice).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  className="mt-4 rounded-xl bg-slate-800 py-3 active:opacity-80"
                  onPress={() => handleAddItem(customerOrder.localId)}
                >
                  <Text className="text-center font-bold text-white">
                    + Agregar artículo
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable
          className="mt-5 rounded-xl border border-dashed border-slate-400 py-4 active:opacity-80"
          onPress={handleAddCustomer}
        >
          <Text className="text-center font-bold text-slate-700">
            + Agregar otro cliente
          </Text>
        </Pressable>

        <Pressable
          className={`mt-6 rounded-xl py-4 active:opacity-80 ${
            isSaving ? "bg-slate-500" : "bg-emerald-600"
          }`}
          onPress={handleSaveChanges}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-center font-bold text-white">
              Guardar cambios
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
