import { getCachedOrders, saveCachedOrders } from "@/src/database/localDb";
import type { Order } from "@/src/features/orders/order.types";

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
