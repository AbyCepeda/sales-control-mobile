import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import type { Order, OrderStatus } from "@/src/features/orders/order.types";
import { getOrderPaymentSummary } from "@/src/features/orders/orderPayment.utils";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  order: Order;
  isUpdating: boolean;
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
};

/**
 * Card resumen de pedido.
 *
 * Para qué sirve:
 * - Muestra información principal del pedido.
 * - Permite abrir/cerrar el resumen de clientes.
 * - Permite cambiar estado rápido.
 *
 * Beneficio:
 * - Si un pedido tiene muchos clientes o artículos, la pantalla no queda enorme.
 */
export function OrderSummaryCard({
  order,
  isUpdating,
  onUpdateStatus,
}: OrderSummaryCardProps) {
  /**
   * Controla si mostramos u ocultamos los clientes del pedido.
   *
   * Para qué sirve:
   * - Evita mostrar todo el detalle desde el inicio.
   *
   * Beneficio:
   * - La lista de pedidos queda más limpia.
   */
  const [showCustomers, setShowCustomers] = useState(false);

  const allItems = order.customerOrders.flatMap(
    (customerOrder) => customerOrder.items,
  );

  const orderPaymentSummary = getOrderPaymentSummary(allItems);

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

          <Text className="mt-1 text-sm font-bold text-emerald-700">
            Pagado: ${orderPaymentSummary.paidTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-orange-600">
            Pendiente: ${orderPaymentSummary.pendingTotal.toFixed(2)}
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

      <Pressable
        className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 active:opacity-80"
        onPress={() => setShowCustomers((current) => !current)}
      >
        <Text className="text-center font-bold text-white">
          {showCustomers ? "Ocultar clientes" : "Ver clientes del pedido"}
        </Text>
      </Pressable>

      {showCustomers ? (
        <View className="mt-4 gap-3">
          {order.customerOrders.map((customerOrder) => {
            const paymentSummary = getOrderPaymentSummary(customerOrder.items);

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
                  Pagados: {paymentSummary.paidItemsCount}/
                  {paymentSummary.totalItems}
                </Text>

                <Text className="mt-1 text-sm font-bold text-orange-600">
                  Pendientes: {paymentSummary.pendingItemsCount}
                </Text>

                <Text className="mt-1 text-sm font-bold text-emerald-700">
                  Total pagado: ${paymentSummary.paidTotal.toFixed(2)}
                </Text>

                <Text className="mt-1 text-sm font-bold text-orange-600">
                  Total pendiente: ${paymentSummary.pendingTotal.toFixed(2)}
                </Text>

                <Text className="mt-1 text-sm font-bold text-slate-700">
                  Total cliente: ${Number(customerOrder.total).toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </AppCard>
  );
}
