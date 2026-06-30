import type { OrderStatus } from "@/src/features/orders/order.types";

/**
 * Convierte el estado técnico del backend a texto para el usuario.
 *
 * Para qué sirve:
 * - El backend usa valores como PENDING, PAID, DELIVERED.
 * - La app muestra textos como Pendiente, Pagado, Entregado.
 *
 * Beneficio:
 * - Evitamos repetir el mismo diccionario en varias pantallas.
 * - Si después cambiamos una etiqueta, solo se cambia aquí.
 */
export function getOrderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}
