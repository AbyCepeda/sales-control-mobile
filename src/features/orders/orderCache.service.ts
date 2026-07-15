import { getCachedOrders, saveCachedOrders } from "@/src/database/localDb";
import type {
  CreateOrderCustomerRequest,
  Order,
  OrderStatus,
} from "@/src/features/orders/order.types";

/**
 * Estructura que guardaremos localmente.
 *
 * Para qué sirve:
 * - Guardar la misma forma de respuesta que usa la pantalla de pedidos.
 *
 * Beneficio:
 * - Podemos usar la caché sin cambiar demasiado la UI.
 */
export type CachedOrdersResponse = {
  data: Order[];
};

/**
 * Payload usado cuando editamos un pedido completo.
 *
 * Para qué sirve:
 * - Representa la información que mandamos al endpoint:
 *   PUT /api/orders/:id/full
 *
 * Beneficio:
 * - Podemos reutilizar este mismo payload para actualizar la caché local
 *   cuando no hay internet.
 */
export type CachedOrderUpdatePayload = {
  status: OrderStatus;
  notes: string | null;
  deliveryDate: string | null;
  customers: CreateOrderCustomerRequest[];
};

/**
 * Guarda pedidos en caché local.
 *
 * Para qué sirve:
 * - Se ejecuta cuando la API responde correctamente.
 *
 * Beneficio:
 * - Si después no hay internet, la app puede mostrar la última lista guardada.
 */
export async function saveOrdersCache(ordersResponse: CachedOrdersResponse) {
  await saveCachedOrders(ordersResponse);
}

/**
 * Lee pedidos desde caché local.
 *
 * Para qué sirve:
 * - Se usa cuando la API falla.
 *
 * Beneficio:
 * - Permite mostrar pedidos existentes aunque no haya red.
 */
export async function getOrdersCache() {
  return getCachedOrders<CachedOrdersResponse>();
}

/**
 * Actualiza un pedido específico dentro de la caché local.
 *
 * Para qué sirve:
 * - Cuando editas un pedido sin internet, el backend no se puede actualizar.
 * - Entonces actualizamos la copia local para que la app muestre los cambios.
 *
 * Beneficio:
 * - El usuario ve el pedido actualizado inmediatamente aunque siga offline.
 * - Luego la cola UPDATE_ORDER se encarga de subirlo cuando vuelva internet.
 */
export async function updateCachedOrder(
  orderId: number,
  payload: CachedOrderUpdatePayload,
) {
  const cachedOrders = await getOrdersCache();

  if (!cachedOrders) {
    return;
  }

  const now = new Date().toISOString();

  const updatedOrders = cachedOrders.data.map((order) => {
    if (order.id !== orderId) {
      return order;
    }

    const updatedCustomerOrders = payload.customers.map(
      (customerOrder, customerIndex) => {
        const previousCustomerOrder = order.customerOrders[customerIndex];

        const customerOrderId =
          previousCustomerOrder?.id ?? Date.now() + customerIndex;

        const customerId =
          previousCustomerOrder?.customerId ?? Date.now() + customerIndex;

        const updatedItems = customerOrder.items.map((item, itemIndex) => {
          const previousItem = previousCustomerOrder?.items[itemIndex];

          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const subtotal = quantity * unitPrice;

          return {
            id: previousItem?.id ?? Date.now() + itemIndex,
            orderId: order.id,
            customerOrderId,
            productId: previousItem?.productId ?? null,

            skuSnapshot: item.sku,
            nameSnapshot: item.name,
            descriptionSnapshot: item.description ?? null,

            /**
             * En el backend los Decimal suelen llegar como string.
             *
             * Para qué sirve:
             * - Mantenemos la forma parecida a la respuesta real de la API.
             *
             * Beneficio:
             * - Evitamos errores de tipos y de formato al mostrar totales.
             */
            unitPriceSnapshot: unitPrice.toFixed(2),
            quantity,
            subtotal: subtotal.toFixed(2),

            isPaid: item.isPaid ?? false,
            product: previousItem?.product ?? null,
          };
        });

        const customerTotal = updatedItems.reduce((total, item) => {
          return total + Number(item.subtotal);
        }, 0);

        return {
          id: customerOrderId,
          orderId: order.id,
          customerId,

          notes: customerOrder.notes ?? null,
          total: customerTotal.toFixed(2),
          createdAt: previousCustomerOrder?.createdAt ?? now,
          updatedAt: now,

          customer: {
            id: previousCustomerOrder?.customer.id ?? customerId,
            name: customerOrder.name,
            phone: customerOrder.phone ?? null,
            notes: customerOrder.notes ?? null,

            /**
             * Tu tipo de cliente requiere isActive.
             *
             * Para qué sirve:
             * - Conserva el valor anterior si ya existía.
             * - Si es cliente nuevo en edición offline, lo marca activo.
             */
            isActive: previousCustomerOrder?.customer.isActive ?? true,

            createdAt: previousCustomerOrder?.customer.createdAt ?? now,
            updatedAt: now,
          },

          items: updatedItems,
        };
      },
    );

    const totalAmount = updatedCustomerOrders.reduce((orderTotal, customer) => {
      return orderTotal + Number(customer.total);
    }, 0);

    /**
     * Usamos as Order porque esta caché es una copia local temporal.
     *
     * Para qué sirve:
     * - TypeScript no se queda pidiendo cada detalle interno de Prisma.
     *
     * Beneficio:
     * - La UI puede mostrar el pedido actualizado offline.
     * - La sincronización real sigue usando el payload limpio guardado en sync_queue.
     */
    return {
      ...order,
      status: payload.status,
      notes: payload.notes,
      deliveryDate: payload.deliveryDate,

      /**
       * Dejamos ambos por compatibilidad:
       * - totalAmount: estructura actual de tus pantallas.
       * - total: por si alguna parte todavía espera este nombre.
       */
      totalAmount,
      total: totalAmount.toFixed(2),

      customerOrders: updatedCustomerOrders,
      updatedAt: now,
    } as Order;
  });

  await saveOrdersCache({
    data: updatedOrders,
  });
}
