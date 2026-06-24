/**
 * Estados posibles de un pedido.
 *
 * Deben coincidir con el enum OrderStatus del backend.
 */
export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

/**
 * Cliente relacionado a un pedido.
 *
 * Nueva lógica:
 * - El cliente puede crearse automáticamente desde la pantalla de pedidos.
 *
 * Beneficio:
 * - El vendedor no necesita registrar clientes antes.
 */
export type OrderCustomer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Vendedor que registró el pedido.
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
 * - El producto se crea o actualiza automáticamente por SKU.
 * - El pedido conserva snapshots históricos.
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
 * Item comprado por un cliente dentro de un pedido.
 *
 * Beneficio:
 * - Conserva el precio, nombre y SKU originales aunque el producto cambie después.
 */
export type OrderItem = {
  id: number;
  customerOrderId: number;
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
 * Cliente dentro de un pedido general.
 *
 * Ejemplo:
 * Pedido #1
 * - Cliente María
 *   - Perfume
 *   - Crema
 * - Cliente Juan
 *   - Shampoo
 */
export type CustomerOrder = {
  id: number;
  orderId: number;
  customerId: number;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  customer: OrderCustomer;
  items: OrderItem[];
};

/**
 * Pedido general recibido desde backend.
 */
export type Order = {
  id: number;
  sellerId: number;
  total: string;
  status: OrderStatus;
  purchaseDate: string;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  seller: OrderSeller;
  customerOrders: CustomerOrder[];
};

/**
 * Artículo que se manda al backend al crear pedido.
 *
 * Nueva lógica:
 * - No mandamos productId.
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
 * Cliente capturado manualmente dentro del pedido.
 *
 * Nueva lógica:
 * - Ya no mandamos customerId.
 * - Mandamos name, phone y notes.
 * - El backend crea o reutiliza cliente por teléfono.
 */
export type CreateOrderCustomerRequest = {
  name: string;
  phone?: string | null;
  notes?: string | null;
  items: CreateOrderItemRequest[];
};

/**
 * Body para crear pedido general.
 *
 * Endpoint:
 * POST /api/orders
 */
export type CreateOrderRequest = {
  deliveryDate?: string | null;
  notes?: string | null;
  customers: CreateOrderCustomerRequest[];
};

/**
 * Body para actualizar pedido.
 *
 * Endpoint:
 * PUT /api/orders/:id
 */
export type UpdateOrderRequest = {
  status?: OrderStatus;
  deliveryDate?: string | null;
  notes?: string | null;
};

/**
 * Body para editar un pedido completo.
 *
 * Para qué sirve:
 * - Permite editar notas, estado, clientes y artículos.
 *
 * Beneficio:
 * - Podemos agregar clientes/artículos después de crear el pedido.
 * - El backend recalcula los totales.
 */
export type UpdateFullOrderRequest = {
  status?: OrderStatus;
  deliveryDate?: string | null;
  notes?: string | null;
  customers: CreateOrderCustomerRequest[];
};
