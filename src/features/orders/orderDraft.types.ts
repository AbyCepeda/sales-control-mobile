import type { CreateOrderItemRequest } from "@/src/features/orders/order.types";

/**
 * Artículo temporal usado solo en las pantallas de formulario.
 *
 * Para qué sirve:
 * - Representa un artículo antes de guardarlo en backend.
 * - Agrega localId para poder renderizar listas en React Native.
 *
 * Beneficio:
 * - Crear pedido y editar pedido usan el mismo tipo.
 * - Evitamos repetir este type en varias pantallas.
 */
export type DraftOrderItem = CreateOrderItemRequest & {
  localId: string;
};

/**
 * Cliente temporal usado dentro de formularios de pedido.
 *
 * Para qué sirve:
 * - Guarda temporalmente los datos del cliente y sus artículos.
 *
 * Beneficio:
 * - Podemos reutilizarlo en:
 *   - Nuevo pedido
 *   - Editar pedido
 */
export type DraftCustomerOrder = {
  localId: string;
  name: string;
  phone: string;
  notes: string;
  items: DraftOrderItem[];
};
