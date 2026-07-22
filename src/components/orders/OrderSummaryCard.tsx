import { OrderStatusSelector } from "@/src/components/orders/OrderStatusSelector";
import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import type {
  CustomerOrder,
  Order,
  OrderStatus,
} from "@/src/features/orders/order.types";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Props del componente OrderSummaryCard.
 */
type OrderSummaryCardProps = {
  order: Order;
  isUpdating: boolean;
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
};

/**
 * Suma los abonos de un cliente dentro de un pedido.
 *
 * Para qué sirve:
 * - Calcula cuánto ha pagado realmente ese cliente.
 *
 * Beneficio:
 * - Ya no dependemos de artículos marcados como pagados.
 * - El resumen coincide con la sección de abonos.
 */
function getCustomerPaidTotal(customerOrder: CustomerOrder) {
  return customerOrder.payments.reduce((total, payment) => {
    return total + Number(payment.amount);
  }, 0);
}

/**
 * Calcula cuánto falta por pagar de un cliente.
 */
function getCustomerPendingTotal(customerOrder: CustomerOrder) {
  const customerTotal = Number(customerOrder.total);
  const paidTotal = getCustomerPaidTotal(customerOrder);

  return Math.max(customerTotal - paidTotal, 0);
}

/**
 * Suma todos los abonos de todos los clientes del pedido.
 */
function getOrderPaidTotal(order: Order) {
  return order.customerOrders.reduce((orderPaidTotal, customerOrder) => {
    return orderPaidTotal + getCustomerPaidTotal(customerOrder);
  }, 0);
}

/**
 * Card resumen de pedido.
 *
 * Nueva lógica:
 * - Pagado = suma de abonos de todos los clientes.
 * - Pendiente = total del pedido - abonos.
 *
 * Beneficio:
 * - La tarjeta del pedido ahora coincide con la pantalla de detalle.
 */
export function OrderSummaryCard({
  order,
  isUpdating,
  onUpdateStatus,
}: OrderSummaryCardProps) {
  const [showCustomers, setShowCustomers] = useState(false);

  const orderTotal = Number(order.total);
  const orderPaidTotal = getOrderPaidTotal(order);
  const orderPendingTotal = Math.max(orderTotal - orderPaidTotal, 0);

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
            Pagado: ${orderPaidTotal.toFixed(2)}
          </Text>

          <Text className="mt-1 text-sm font-bold text-orange-600">
            Pendiente: ${orderPendingTotal.toFixed(2)}
          </Text>

          <View className="mt-2">
            <StatusBadge status={order.status} />
          </View>
        </View>

        <Text className="text-lg font-extrabold text-emerald-700">
          ${orderTotal.toFixed(2)}
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
            const customerTotal = Number(customerOrder.total);
            const customerPaidTotal = getCustomerPaidTotal(customerOrder);
            const customerPendingTotal = getCustomerPendingTotal(customerOrder);

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

                <Text className="mt-1 text-sm font-bold text-slate-700">
                  Abonos registrados: {customerOrder.payments.length}
                </Text>

                <Text className="mt-1 text-sm font-bold text-emerald-700">
                  Total pagado: ${customerPaidTotal.toFixed(2)}
                </Text>

                <Text className="mt-1 text-sm font-bold text-orange-600">
                  Total pendiente: ${customerPendingTotal.toFixed(2)}
                </Text>

                <Text className="mt-1 text-sm font-bold text-slate-700">
                  Total cliente: ${customerTotal.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </AppCard>
  );
}
