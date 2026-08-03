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
import { syncPendingOrders } from "@/src/features/sync/syncOrders.service";
import {
  addSyncQueueItem,
  countPendingSyncQueueItems,
  getPendingSyncQueueItems,
} from "@/src/features/sync/syncQueue.service";
import { useAutoSyncOrders } from "@/src/features/sync/useAutoSyncOrders";
import { useNetworkStatus } from "@/src/features/sync/useNetworkStatus";
import {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "@/src/services/ordersApi";
import { useAppSelector } from "@/src/store/hooks";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  ToastAndroid,
  View,
} from "react-native";

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

type OrderStatusFilter = OrderStatus | "ALL";

const STATUS_FILTER_OPTIONS: {
  label: string;
  value: OrderStatusFilter;
}[] = [
  { label: "Todos", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Pagados", value: "PAID" },
  { label: "Entregados", value: "DELIVERED" },
  { label: "Cancelados", value: "CANCELLED" },
];

type PendingOfflineOrder = {
  id: number;
  notes: string | null;
  customers: {
    name: string;
    phone: string | null;
    notes: string | null;
    items: {
      sku: string;
      name: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      isPaid?: boolean;
    }[];
  }[];
};

type PendingOfflineUpdate = {
  id: number;
  orderId: number;
  status: OrderStatus;
  notes: string | null;
  customers: {
    name: string;
    phone: string | null;
    notes: string | null;
    items: {
      sku: string;
      name: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      isPaid?: boolean;
    }[];
  }[];
};

function showOfflineOrderToast() {
  const message =
    "Pedido guardado offline. Se sincronizará cuando vuelva internet.";

  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }

  Alert.alert("Pedido guardado offline", message);
}

export default function OrdersScreen() {
  const authUser = useAppSelector((state) => state.auth.user);

  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch,
  } = useGetOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();

  const [updateOrder, { isLoading: isUpdatingOrder }] =
    useUpdateOrderMutation();

  const [showForm, setShowForm] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("ALL");

  const [expandedItemLocalId, setExpandedItemLocalId] = useState<string | null>(
    null,
  );

  const [expandedCustomerLocalId, setExpandedCustomerLocalId] = useState<
    string | null
  >(null);

  const [draftCustomers, setDraftCustomers] = useState<DraftCustomerOrder[]>([
    createEmptyCustomerOrder(),
  ]);

  const [pendingOfflineOrders, setPendingOfflineOrders] = useState<
    PendingOfflineOrder[]
  >([]);

  const [pendingOfflineUpdates, setPendingOfflineUpdates] = useState<
    PendingOfflineUpdate[]
  >([]);

  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const [cachedOrdersData, setCachedOrdersData] =
    useState<CachedOrdersResponse | null>(null);

  const isShowingOfflineCache = Boolean(ordersError && cachedOrdersData);
  const orders = ordersData?.data ?? cachedOrdersData?.data ?? [];

  const { isOnline } = useNetworkStatus();

  /**
   * Cuando cambia el usuario autenticado, limpiamos la caché visual
   * de esta pantalla y pedimos de nuevo los pedidos.
   *
   * Para qué sirve:
   * - Evita que un SELLER vea pedidos que quedaron en memoria del ADMIN.
   *
   * Beneficio:
   * - ADMIN ve todos.
   * - SELLER ve solo los suyos.
   */
  useEffect(() => {
    setCachedOrdersData(null);

    if (authUser?.id) {
      refetch();
    }
  }, [authUser?.id, refetch]);

  const loadPendingOfflineOrders = useCallback(async () => {
    try {
      const pendingItems = await getPendingSyncQueueItems();

      const pendingOrders = pendingItems
        .filter((item) => item.type === "CREATE_ORDER")
        .map((item) => {
          const payload = JSON.parse(item.payload) as Omit<
            PendingOfflineOrder,
            "id"
          >;

          return {
            id: item.id,
            ...payload,
          };
        });

      const pendingUpdates = pendingItems
        .filter((item) => item.type === "UPDATE_ORDER")
        .map((item) => {
          const payload = JSON.parse(item.payload) as {
            id: number;
            body: Omit<PendingOfflineUpdate, "id" | "orderId">;
          };

          return {
            id: item.id,
            orderId: payload.id,
            ...payload.body,
          };
        });

      const pendingCount = await countPendingSyncQueueItems();

      setPendingOfflineOrders(pendingOrders);
      setPendingOfflineUpdates(pendingUpdates);
      setPendingOfflineCount(pendingCount);
    } catch (error) {
      console.log("LOAD_PENDING_OFFLINE_ORDERS_ERROR:", error);

      setPendingOfflineOrders([]);
      setPendingOfflineUpdates([]);
      setPendingOfflineCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPendingOfflineOrders();
    }, [loadPendingOfflineOrders]),
  );

  useEffect(() => {
    if (!ordersData) {
      return;
    }

    const currentOrdersData = ordersData;

    async function cacheOrders() {
      try {
        await saveOrdersCache(currentOrdersData);
        setCachedOrdersData(currentOrdersData);
      } catch (error) {
        console.log("SAVE_ORDERS_CACHE_ERROR:", error);
      }
    }

    cacheOrders();
  }, [ordersData]);

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
        console.log("GET_ORDERS_CACHE_ERROR:", error);
      }
    }

    loadCachedOrders();
  }, [ordersError]);

  useEffect(() => {
    loadPendingOfflineOrders();
  }, [loadPendingOfflineOrders]);

  useAutoSyncOrders({
    onSyncSuccess: async () => {
      await refetch();
      await loadPendingOfflineOrders();
    },
  });

  const orderStatusCounts = useMemo(() => {
    const counts: Record<OrderStatusFilter, number> = {
      ALL: orders.length,
      PENDING: 0,
      PAID: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const order of orders) {
      counts[order.status] += 1;
    }

    return counts;
  }, [orders]);

  const activeStatusFilterLabel =
    STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
      ?.label ?? "Todos";

  const hasActiveFilters = Boolean(searchText.trim() || statusFilter !== "ALL");

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
    } catch {
      await addSyncQueueItem("CREATE_ORDER", payload);
      await loadPendingOfflineOrders();

      setOrderNotes("");
      setExpandedCustomerLocalId(null);
      setExpandedItemLocalId(null);
      setDraftCustomers([createEmptyCustomerOrder()]);
      setShowForm(false);

      showOfflineOrderToast();
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
      console.log("UPDATE_ORDER_ERROR:", JSON.stringify(error, null, 2));

      Alert.alert(
        "Error al actualizar",
        error?.data?.message ?? "No se pudo actualizar el pedido.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function handleSyncPendingOrders() {
    try {
      setIsSyncingOrders(true);

      const result = await syncPendingOrders();

      await refetch();
      await loadPendingOfflineOrders();

      if (result.total === 0) {
        Alert.alert(
          "Sin pendientes",
          "No hay acciones offline pendientes por sincronizar.",
        );
        return;
      }

      Alert.alert(
        "Sincronización terminada",
        `Acciones encontradas: ${result.total}\nSincronizadas: ${result.synced}\nFallidas: ${result.failed}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron sincronizar los pedidos.";

      Alert.alert("Error al sincronizar", message);
    } finally {
      setIsSyncingOrders(false);
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

          <View className="gap-2">
            <AppButton
              title={showForm ? "Cerrar" : "+ Nuevo"}
              onPress={handleToggleForm}
              className="px-4 py-3"
              textClassName="text-sm"
            />

            <AppButton
              title={
                pendingOfflineCount > 0
                  ? `Sincronizar (${pendingOfflineCount})`
                  : "Sincronizar"
              }
              variant="outline"
              onPress={handleSyncPendingOrders}
              isLoading={isSyncingOrders}
              className="px-4 py-3"
              textClassName="text-sm"
            />
          </View>
        </View>

        <AppCard
          className={`mt-6 border ${
            isOnline
              ? "border-emerald-300 bg-emerald-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <Text
            className={`text-base font-extrabold ${
              isOnline ? "text-emerald-800" : "text-red-800"
            }`}
          >
            {isOnline ? "En línea" : "Sin conexión"}
          </Text>

          <Text
            className={`mt-1 text-sm ${
              isOnline ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isOnline
              ? "La app está conectada al servidor."
              : "Los pedidos nuevos y cambios de pedidos se guardarán offline."}
          </Text>
        </AppCard>

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
                    customerPaidTotal={0}
                    customerPendingTotal={customerTotal}
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
            {STATUS_FILTER_OPTIONS.map((option) => {
              const isSelected = statusFilter === option.value;
              const count = orderStatusCounts[option.value];

              return (
                <AppButton
                  key={option.value}
                  title={`${option.label} (${count})`}
                  variant={isSelected ? "primary" : "outline"}
                  className="px-3 py-2"
                  textClassName="text-xs"
                  onPress={() => setStatusFilter(option.value)}
                />
              );
            })}
          </View>

          <Text className="mt-4 text-sm text-slate-500">
            Mostrando {filteredOrders.length} de {orders.length} pedidos. Filtro
            activo: {activeStatusFilterLabel}.
          </Text>

          {hasActiveFilters ? (
            <AppButton
              title="Limpiar filtros"
              variant="outline"
              className="mt-4 py-3"
              onPress={() => {
                setSearchText("");
                setStatusFilter("ALL");
              }}
            />
          ) : null}
        </AppCard>

        {pendingOfflineCount > 0 ? (
          <AppCard className="mt-6 border border-amber-300 bg-amber-50">
            <Text className="text-base font-extrabold text-amber-800">
              Pendientes por sincronizar
            </Text>

            <Text className="mt-1 text-sm text-amber-700">
              Tienes {pendingOfflineCount} acción
              {pendingOfflineCount === 1 ? "" : "es"} pendiente
              {pendingOfflineCount === 1 ? "" : "s"} en este dispositivo.
            </Text>

            <Text className="mt-2 text-xs text-amber-700">
              Nuevos pedidos: {pendingOfflineOrders.length} · Cambios de
              pedidos: {pendingOfflineUpdates.length}
            </Text>
          </AppCard>
        ) : null}

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

        {pendingOfflineUpdates.length ? (
          <View className="mt-6 gap-4">
            {pendingOfflineUpdates.map((offlineUpdate) => {
              const total = offlineUpdate.customers.reduce(
                (orderTotal, customer) => {
                  const customerTotal = customer.items.reduce(
                    (itemsTotal, item) => {
                      return itemsTotal + item.quantity * item.unitPrice;
                    },
                    0,
                  );

                  return orderTotal + customerTotal;
                },
                0,
              );

              const customerNames = offlineUpdate.customers
                .map((customer) => customer.name)
                .join(", ");

              return (
                <AppCard
                  key={`update-${offlineUpdate.id}`}
                  className="border border-blue-300 bg-blue-50"
                >
                  <Text className="text-base font-extrabold text-blue-800">
                    Cambios de pedido pendientes
                  </Text>

                  <Text className="mt-1 text-sm text-blue-700">
                    El pedido #{offlineUpdate.orderId} tiene cambios guardados
                    en este dispositivo que aún no se han sincronizado.
                  </Text>

                  <View className="mt-4 rounded-2xl bg-white/70 p-4">
                    <Text className="text-sm font-bold text-slate-700">
                      Clientes
                    </Text>

                    <Text className="mt-1 text-base font-extrabold text-slate-950">
                      {customerNames || "Sin nombre"}
                    </Text>

                    <Text className="mt-3 text-sm font-bold text-slate-700">
                      Total actualizado
                    </Text>

                    <Text className="mt-1 text-2xl font-extrabold text-slate-950">
                      ${total.toFixed(2)}
                    </Text>

                    <Text className="mt-3 text-sm text-slate-500">
                      Artículos:{" "}
                      {offlineUpdate.customers.reduce(
                        (count, customer) => count + customer.items.length,
                        0,
                      )}
                    </Text>
                  </View>

                  <Text className="mt-4 text-xs text-blue-700">
                    Presiona “Sincronizar” cuando tengas conexión para subir los
                    cambios al servidor.
                  </Text>
                </AppCard>
              );
            })}
          </View>
        ) : null}

        {pendingOfflineOrders.length ? (
          <View className="mt-6 gap-4">
            {pendingOfflineOrders.map((offlineOrder) => {
              const total = offlineOrder.customers.reduce(
                (orderTotal, customer) => {
                  const customerTotal = customer.items.reduce(
                    (itemsTotal, item) => {
                      return itemsTotal + item.quantity * item.unitPrice;
                    },
                    0,
                  );

                  return orderTotal + customerTotal;
                },
                0,
              );

              const customerNames = offlineOrder.customers
                .map((customer) => customer.name)
                .join(", ");

              return (
                <AppCard
                  key={`create-${offlineOrder.id}`}
                  className="border border-amber-300 bg-amber-50"
                >
                  <Text className="text-base font-extrabold text-amber-800">
                    Pedido offline pendiente
                  </Text>

                  <Text className="mt-1 text-sm text-amber-700">
                    Este pedido se creó sin conexión y aún no está en el
                    servidor.
                  </Text>

                  <View className="mt-4 rounded-2xl bg-white/70 p-4">
                    <Text className="text-sm font-bold text-slate-700">
                      Clientes
                    </Text>

                    <Text className="mt-1 text-base font-extrabold text-slate-950">
                      {customerNames || "Sin nombre"}
                    </Text>

                    <Text className="mt-3 text-sm font-bold text-slate-700">
                      Total
                    </Text>

                    <Text className="mt-1 text-2xl font-extrabold text-slate-950">
                      ${total.toFixed(2)}
                    </Text>

                    <Text className="mt-3 text-sm text-slate-500">
                      Artículos:{" "}
                      {offlineOrder.customers.reduce(
                        (count, customer) => count + customer.items.length,
                        0,
                      )}
                    </Text>
                  </View>

                  <Text className="mt-4 text-xs text-amber-700">
                    Presiona “Sincronizar” cuando tengas conexión para subirlo.
                  </Text>
                </AppCard>
              );
            })}
          </View>
        ) : null}

        {isLoadingOrders ? (
          <View className="mt-6 items-center rounded-3xl bg-white p-8">
            <ActivityIndicator />
            <Text className="mt-3 text-slate-500">Cargando pedidos...</Text>
          </View>
        ) : filteredOrders.length ? (
          <View className="mt-6 gap-4">
            {filteredOrders.map((order) => (
              <OrderSummaryCard
                key={order.id}
                order={order}
                isUpdating={updatingOrderId === order.id && isUpdatingOrder}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            ))}
          </View>
        ) : (
          <AppCard className="mt-6">
            <Text className="text-center text-base font-bold text-slate-600">
              No hay pedidos para mostrar.
            </Text>

            <Text className="mt-2 text-center text-sm text-slate-500">
              {hasActiveFilters
                ? "Intenta limpiar los filtros o buscar otro cliente."
                : "Cuando registres pedidos aparecerán aquí."}
            </Text>
          </AppCard>
        )}
      </View>
    </ScrollView>
  );
}
