import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import type { Order, OrderStatus } from "@/src/features/orders/order.types";
import { router } from "expo-router";
import { Text, View } from "react-native";

/**
 * Props del componente OrderSummaryCard.
 *
 * Para qué sirve:
 * - Define qué datos necesita la card para pintar un pedido.
 *
 * Beneficio:
 * - La pantalla orders.tsx ya no carga con todo el diseño del pedido.
 */
type OrderSummaryCardProps = {
  /**
   * Pedido que se va a mostrar.
   */
  order: Order;

  /**
   * Indica si este pedido está actualizando su estado.
   *
   * Para qué sirve:
   * - Bloquea el selector mientras se guarda el cambio.
   *
   * Beneficio:
   * - Evita mandar varias peticiones seguidas por accidente.
   */
  isUpdating: boolean;

  /**
   * Función para cambiar el estado rápido del pedido.
   */
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
};

/**
 * Card resumen de pedido.
 *
 * Para qué sirve:
 * - Muestra pedido, total, estado, clientes y conteo de artículos pagados.
 * - Permite entrar al detalle.
 * - Permite cambiar estado rápido.
 *
 * Beneficio:
 * - Reutilizamos el diseño de pedido.
 * - orders.tsx queda más corto y fácil de mantener.
 */
export function OrderSummaryCard({
  order,
  isUpdating,
  onUpdateStatus,
}: OrderSummaryCardProps) {
  return (
    <AppCard>
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
          disabled={isUpdating}
          onChange={(statusValue) => onUpdateStatus(order.id, statusValue)}
        />

        {isUpdating ? (
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
            <View key={customerOrder.id} className="rounded-xl bg-slate-50 p-4">
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
                Pagados: {paidItemsCount}/{customerOrder.items.length}
              </Text>

              <Text className="mt-1 text-sm font-bold text-slate-700">
                Total cliente: ${Number(customerOrder.total).toFixed(2)}
              </Text>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}
