/**
 * Estados posibles de un pedido.
 *
 * Deben coincidir con el enum OrderStatus del backend.
 */
export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

/**
 * Cliente relacionado al pedido.
 *
 * Beneficio:
 * - Permite mostrar quién hizo el pedido sin hacer otra petición.
 */
export type OrderCustomer = {
  id: number;
  name: string;
  phone: string | null;
};

/**
 * Vendedor que registró el pedido.
 *
 * Beneficio:
 * - Permite saber quién capturó la venta.
 */
export type OrderSeller = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SELLER";
};

/**
 * Producto relacionado al item.
 *
 * Importante:
 * - El producto puede actualizarse después.
 * - Los datos históricos reales viven en los snapshots del item.
 */
export type OrderProduct = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Item dentro de un pedido.
 *
 * Nueva lógica:
 * - Usamos snapshots para conservar cómo se vendió el artículo.
 *
 * Beneficio:
 * - Si después cambia el producto, el pedido conserva el nombre,
 *   descripción, SKU y precio originales.
 */
export type OrderItem = {
  id: number;
  orderId: number;
  productId: number | null;

  skuSnapshot: string;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPriceSnapshot: string;

  quantity: number;
  subtotal: string;

  product: OrderProduct | null;
};

/**
 * Pedido completo recibido desde el backend.
 */
export type Order = {
  id: number;
  customerId: number;
  sellerId: number;
  total: string;
  status: OrderStatus;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  customer: OrderCustomer;
  seller: OrderSeller;
  items: OrderItem[];
};

/**
 * Artículo que se manda al backend al crear pedido.
 *
 * Nueva lógica:
 * - Ya no mandamos productId.
 * - Mandamos SKU, nombre, descripción, cantidad y precio.
 */
export type CreateOrderItemRequest = {
  sku: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

/**
 * Body para crear un pedido por cliente.
 *
 * Endpoint:
 * POST /api/customers/:customerId/orders
 */
export type CreateCustomerOrderRequest = {
  customerId: number;
  items: CreateOrderItemRequest[];
  deliveryDate?: string | null;
  notes?: string | null;
};
