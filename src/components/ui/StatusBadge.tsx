import type { OrderStatus } from "@/src/features/orders/order.types";
import { Text, View } from "react-native";

/**
 * Props del badge de estado.
 */
type StatusBadgeProps = {
  /**
   * Estado del pedido.
   */
  status: OrderStatus;
};

/**
 * Traduce el estado técnico a texto visible.
 *
 * Para qué sirve:
 * - Evita mostrar PENDING, PAID, etc. directamente al usuario.
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
 * Obtiene clases de color según el estado.
 *
 * Beneficio:
 * - El usuario identifica rápido el estado visualmente.
 */
function getStatusClassName(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "bg-orange-100",
    PAID: "bg-emerald-100",
    DELIVERED: "bg-blue-100",
    CANCELLED: "bg-red-100",
  };

  return classes[status];
}

/**
 * Obtiene color del texto según el estado.
 */
function getStatusTextClassName(status: OrderStatus) {
  const classes: Record<OrderStatus, string> = {
    PENDING: "text-orange-700",
    PAID: "text-emerald-700",
    DELIVERED: "text-blue-700",
    CANCELLED: "text-red-700",
  };

  return classes[status];
}

/**
 * Badge reutilizable para estado de pedido.
 *
 * Para qué sirve:
 * - Muestra el estado de forma consistente en dashboard, lista y detalle.
 *
 * Beneficio:
 * - No repetimos lógica de colores ni traducciones.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-3 py-1 ${getStatusClassName(
        status,
      )}`}
    >
      <Text className={`text-xs font-bold ${getStatusTextClassName(status)}`}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}
