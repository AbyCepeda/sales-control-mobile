/**
 * Estados posibles de un pedido.
 *
 * Deben coincidir con el enum OrderStatus del backend.
 */
export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

/**
 * Métodos de pago.
 *
 * Deben coincidir con el enum PaymentMethod del backend.
 */
export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OTHER";

/**
 * Cliente relacionado a un pedido.
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
  isPaid: boolean;

  product: OrderProduct | null;
};

/**
 * Pago o abono registrado para un cliente dentro de un pedido.
 *
 * Antes:
 * - El pago pertenecía al pedido general.
 *
 * Ahora:
 * - El pago pertenece a CustomerOrder.
 *
 * Beneficio:
 * - Sabemos exactamente qué cliente pagó.
 * - Podemos calcular pagado y pendiente por cliente.
 */
export type CustomerOrderPayment = {
  id: number;
  customerOrderId: number;
  amount: string;
  method: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Cliente dentro de un pedido general.
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

  /**
   * Abonos de este cliente dentro del pedido.
   */
  payments: CustomerOrderPayment[];
};

/**
 * Resumen de pagos de un cliente dentro de un pedido.
 */
export type CustomerOrderPaymentSummary = {
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  isFullyPaid: boolean;
  hasPayments: boolean;
};

/**
 * Pedido general recibido desde backend.
 *
 * Importante:
 * - Ya NO tiene payments directo.
 * - Los pagos están dentro de cada customerOrder.
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
 * Artículo que se manda al backend al crear o editar pedido.
 */
export type CreateOrderItemRequest = {
  sku: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  isPaid?: boolean;
};

/**
 * Cliente capturado manualmente dentro del pedido.
 */
export type CreateOrderCustomerRequest = {
  name: string;
  phone?: string | null;
  notes?: string | null;
  items: CreateOrderItemRequest[];
};

/**
 * Body para crear pedido general.
 */
export type CreateOrderRequest = {
  deliveryDate?: string | null;
  notes?: string | null;
  customers: CreateOrderCustomerRequest[];
};

/**
 * Body para actualizar pedido.
 */
export type UpdateOrderRequest = {
  status?: OrderStatus;
  deliveryDate?: string | null;
  notes?: string | null;
};

/**
 * Body para editar un pedido completo.
 */
export type UpdateFullOrderRequest = {
  status?: OrderStatus;
  deliveryDate?: string | null;
  notes?: string | null;
  customers: CreateOrderCustomerRequest[];
};

/**
 * Body para registrar pago o abono de un cliente dentro del pedido.
 */
export type CreateCustomerOrderPaymentRequest = {
  amount: number;
  method?: PaymentMethod;
  notes?: string | null;
};
