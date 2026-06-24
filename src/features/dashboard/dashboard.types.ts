export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

/**
 * Cliente dentro de un pedido reciente.
 *
 * Nueva estructura:
 * - Un pedido puede tener varios clientes.
 * - Por eso ya no usamos order.customer directo.
 */
export type DashboardCustomer = {
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
export type DashboardSeller = {
  id: number;
  name: string;
  email: string;
  role?: "ADMIN" | "SELLER";
};

/**
 * Artículo dentro de un cliente del pedido.
 *
 * Para qué sirve:
 * - Permite contar artículos y mostrar información si después queremos
 *   hacer el dashboard más detallado.
 */
export type DashboardRecentOrderItem = {
  id: number;
  customerOrderId: number;
  productId: number | null;
  skuSnapshot: string;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPriceSnapshot: string;
  quantity: number;
  subtotal: string;
};

/**
 * Cliente agrupado dentro del pedido.
 *
 * Nueva lógica:
 * - Antes era order.customer.
 * - Ahora es order.customerOrders[] porque un pedido puede tener varios clientes.
 */
export type DashboardRecentCustomerOrder = {
  id: number;
  orderId: number;
  customerId: number;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: DashboardCustomer;
  items: DashboardRecentOrderItem[];
};

/**
 * Pedido reciente del dashboard.
 *
 * Nueva estructura:
 * - customerOrders reemplaza a customer directo.
 */
export type DashboardRecentOrder = {
  id: number;
  sellerId: number;
  total: string;
  status: OrderStatus;
  purchaseDate: string;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller: DashboardSeller;
  customerOrders: DashboardRecentCustomerOrder[];
};

export type DashboardSummary = {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: string;
  activeCustomers: number;
  activeProducts: number;
  recentOrders: DashboardRecentOrder[];
};
