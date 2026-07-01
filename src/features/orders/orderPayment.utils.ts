/**
 * Artículo mínimo que necesita el helper para calcular pagos.
 *
 * Para qué sirve:
 * - No obligamos al helper a depender de todo el tipo OrderItem.
 * - Solo necesita saber subtotal e isPaid.
 *
 * Beneficio:
 * - Esta función se puede reutilizar con artículos del backend
 *   o con artículos temporales del formulario.
 */
type PaymentSummaryItem = {
  subtotal?: string | number;
  quantity?: number;
  unitPrice?: string | number;
  unitPriceSnapshot?: string | number;
  isPaid?: boolean;
};

/**
 * Convierte valores string/number a número seguro.
 *
 * Para qué sirve:
 * - Prisma suele devolver Decimal como string.
 * - React Native puede manejar precios como number.
 *
 * Beneficio:
 * - Evitamos NaN al calcular totales.
 */
function toNumber(value: string | number | undefined | null) {
  if (value === undefined || value === null) {
    return 0;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * Calcula el subtotal de un artículo.
 *
 * Para qué sirve:
 * - Si existe subtotal, lo usamos.
 * - Si no existe subtotal, lo calculamos con quantity * unitPrice.
 *
 * Beneficio:
 * - El helper sirve para datos guardados y datos temporales.
 */
function getItemSubtotal(item: PaymentSummaryItem) {
  const subtotal = toNumber(item.subtotal);

  if (subtotal > 0) {
    return subtotal;
  }

  const quantity = item.quantity ?? 0;
  const unitPrice = toNumber(item.unitPrice ?? item.unitPriceSnapshot);

  return quantity * unitPrice;
}

/**
 * Calcula resumen de pagos de una lista de artículos.
 *
 * Para qué sirve:
 * - Cuenta artículos pagados y pendientes.
 * - Suma total pagado y total pendiente.
 *
 * Beneficio:
 * - Podemos mostrar rápidamente cuánto falta por cobrar.
 */
export function getOrderPaymentSummary(items: PaymentSummaryItem[]) {
  return items.reduce(
    (summary, item) => {
      const subtotal = getItemSubtotal(item);
      const isPaid = item.isPaid ?? false;

      if (isPaid) {
        return {
          ...summary,
          paidItemsCount: summary.paidItemsCount + 1,
          paidTotal: summary.paidTotal + subtotal,
        };
      }

      return {
        ...summary,
        pendingItemsCount: summary.pendingItemsCount + 1,
        pendingTotal: summary.pendingTotal + subtotal,
      };
    },
    {
      paidItemsCount: 0,
      pendingItemsCount: 0,
      paidTotal: 0,
      pendingTotal: 0,
      totalItems: items.length,
    },
  );
}
