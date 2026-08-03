import { logout } from "@/src/features/auth/auth.slice";
import type {
  DashboardRecentOrder,
  OrderStatus,
} from "@/src/features/dashboard/dashboard.types";
import { api } from "@/src/services/api";
import { useGetDashboardQuery } from "@/src/services/dashboardApi";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { removeToken } from "@/src/utils/tokenStorage";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);

  return `$${amount.toFixed(2)}`;
}

function DashboardMetricCard({
  title,
  value,
  description,
  variant = "default",
}: {
  title: string;
  value: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger" | "dark";
}) {
  const variantClassName = {
    default: "bg-white",
    success: "bg-emerald-50 border border-emerald-200",
    warning: "bg-orange-50 border border-orange-200",
    danger: "bg-red-50 border border-red-200",
    dark: "bg-slate-950",
  }[variant];

  const titleClassName =
    variant === "dark" ? "text-slate-400" : "text-slate-500";

  const valueClassName =
    variant === "dark"
      ? "text-white"
      : variant === "success"
        ? "text-emerald-700"
        : variant === "warning"
          ? "text-orange-600"
          : variant === "danger"
            ? "text-red-600"
            : "text-slate-950";

  const descriptionClassName =
    variant === "dark" ? "text-slate-400" : "text-slate-500";

  return (
    <View className={`rounded-3xl p-5 shadow-sm ${variantClassName}`}>
      <Text className={`text-sm font-semibold ${titleClassName}`}>{title}</Text>

      <Text className={`mt-2 text-3xl font-extrabold ${valueClassName}`}>
        {value}
      </Text>

      {description ? (
        <Text className={`mt-2 text-xs ${descriptionClassName}`}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function DashboardMenuCard({
  title,
  description,
  badge,
  onPress,
}: {
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="rounded-3xl bg-white p-5 shadow-sm active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-extrabold text-slate-950">{title}</Text>

          <Text className="mt-1 text-sm text-slate-500">{description}</Text>
        </View>

        {badge ? (
          <View className="rounded-full bg-slate-950 px-3 py-1">
            <Text className="text-xs font-bold text-white">{badge}</Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-4 text-sm font-bold text-slate-950">Entrar →</Text>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: dashboardResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetDashboardQuery();

  const dashboard = dashboardResponse?.data;

  async function handleLogout() {
    await removeToken();
    dispatch(api.util.resetApiState());
    dispatch(logout());
    router.replace("/login");
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-100"
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
    >
      <View className="px-5 pb-10 pt-16">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-3xl font-extrabold text-slate-950">
              Dashboard
            </Text>

            <Text className="mt-1 text-base text-slate-500">
              Bienvenido, {user?.name ?? "usuario"}
            </Text>
          </View>

          <Pressable
            className="rounded-xl bg-red-600 px-4 py-3 active:opacity-80"
            onPress={handleLogout}
          >
            <Text className="text-sm font-bold text-white">Salir</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View className="mt-12 items-center justify-center rounded-3xl bg-white p-8">
            <ActivityIndicator />
            <Text className="mt-3 text-slate-500">Cargando dashboard...</Text>
          </View>
        ) : error ? (
          <View className="mt-8 rounded-3xl bg-white p-6">
            <Text className="text-xl font-extrabold text-red-600">
              No se pudo cargar el dashboard
            </Text>

            <Text className="mt-2 text-slate-500">
              Revisa que el backend esté encendido y que tu sesión siga activa.
            </Text>

            <Pressable
              className="mt-5 rounded-xl bg-slate-950 py-4 active:opacity-80"
              onPress={() => refetch()}
            >
              <Text className="text-center font-bold text-white">
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mt-6">
              <DashboardMetricCard
                title="Total vendido"
                value={formatMoney(dashboard?.totalRevenue)}
                description="No incluye pedidos cancelados"
                variant="dark"
              />
            </View>

            <View className="mt-5 gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <DashboardMetricCard
                    title="Total pagado"
                    value={formatMoney(dashboard?.totalPaid)}
                    description="Abonos registrados"
                    variant="success"
                  />
                </View>

                <View className="flex-1">
                  <DashboardMetricCard
                    title="Pendiente"
                    value={formatMoney(dashboard?.totalPending)}
                    description="Por cobrar"
                    variant="warning"
                  />
                </View>
              </View>

              <DashboardMetricCard
                title="Pagos de hoy"
                value={formatMoney(dashboard?.todayPayments)}
                description="Abonos registrados durante el día"
                variant="default"
              />
            </View>

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1">
                <DashboardMetricCard
                  title="Pedidos"
                  value={`${dashboard?.totalOrders ?? 0}`}
                />
              </View>

              <View className="flex-1">
                <DashboardMetricCard
                  title="Clientes"
                  value={`${dashboard?.activeCustomers ?? 0}`}
                />
              </View>
            </View>

            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <DashboardMetricCard
                  title="Productos"
                  value={`${dashboard?.activeProducts ?? 0}`}
                />
              </View>

              <View className="flex-1">
                <DashboardMetricCard
                  title="Pendientes"
                  value={`${dashboard?.pendingOrders ?? 0}`}
                  variant="warning"
                />
              </View>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-extrabold text-slate-950">
                  Menú principal
                </Text>

                {isFetching ? (
                  <Text className="text-xs text-slate-400">
                    Actualizando...
                  </Text>
                ) : null}
              </View>

              <View className="mt-4 gap-4">
                <DashboardMenuCard
                  title="Productos"
                  description="Consulta productos, precios, stock y disponibilidad."
                  badge={`${dashboard?.activeProducts ?? 0}`}
                  onPress={() => router.push("/(tabs)/products")}
                />

                <DashboardMenuCard
                  title="Clientes"
                  description="Consulta clientes registrados y su historial."
                  badge={`${dashboard?.activeCustomers ?? 0}`}
                  onPress={() => router.push("/(tabs)/customers")}
                />

                <DashboardMenuCard
                  title="Pedidos"
                  description="Revisa pedidos, estados, totales y entregas."
                  badge={`${dashboard?.totalOrders ?? 0}`}
                  onPress={() => router.push("/(tabs)/orders")}
                />

                <DashboardMenuCard
                  title="Nuevo pedido"
                  description="Registra una venta capturando clientes y artículos."
                  badge="+"
                  onPress={() => router.push("/(tabs)/orders")}
                />
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-5">
              <Text className="text-lg font-extrabold text-slate-950">
                Estado de pedidos
              </Text>

              <View className="mt-4 gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Pendientes</Text>
                  <Text className="font-bold text-orange-600">
                    {dashboard?.pendingOrders ?? 0}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Pagados</Text>
                  <Text className="font-bold text-emerald-700">
                    {dashboard?.paidOrders ?? 0}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Entregados</Text>
                  <Text className="font-bold text-slate-950">
                    {dashboard?.deliveredOrders ?? 0}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Cancelados</Text>
                  <Text className="font-bold text-red-600">
                    {dashboard?.cancelledOrders ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6 rounded-3xl bg-white p-5">
              <Text className="text-lg font-extrabold text-slate-950">
                Pedidos recientes
              </Text>

              {dashboard?.recentOrders?.length ? (
                <View className="mt-4 gap-3">
                  {dashboard.recentOrders.map((order: DashboardRecentOrder) => {
                    const customerNames = order.customerOrders
                      .map((customerOrder) => customerOrder.customer.name)
                      .join(", ");

                    return (
                      <Pressable
                        key={order.id}
                        className="rounded-2xl border border-slate-200 p-4 active:opacity-80"
                        onPress={() =>
                          router.push({
                            pathname: "/orders/[id]" as any,
                            params: {
                              id: String(order.id),
                            },
                          })
                        }
                      >
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="flex-1">
                            <Text className="font-bold text-slate-950">
                              Pedido #{order.id}
                            </Text>

                            <Text className="mt-1 text-sm text-slate-500">
                              {customerNames || "Sin cliente"}
                            </Text>
                          </View>

                          <Text className="font-extrabold text-slate-950">
                            {formatMoney(order.total)}
                          </Text>
                        </View>

                        <View className="mt-3 self-start rounded-full bg-slate-100 px-3 py-1">
                          <Text className="text-xs font-bold text-slate-700">
                            {getStatusLabel(order.status)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text className="mt-4 text-slate-500">
                  Todavía no hay pedidos registrados.
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
