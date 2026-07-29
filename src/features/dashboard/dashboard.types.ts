export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

export type DashboardCustomer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardOrderItem = {
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
};

export type DashboardCustomerOrderPayment = {
  id: number;
  customerOrderId: number;
  amount: string;
  method: "CASH" | "TRANSFER" | "CARD" | "OTHER";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardCustomerOrder = {
  id: number;
  orderId: number;
  customerId: number;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: DashboardCustomer;
  items: DashboardOrderItem[];
  payments: DashboardCustomerOrderPayment[];
};

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
  customerOrders: DashboardCustomerOrder[];
};

export type DashboardResponse = {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  totalRevenue: string;
  totalPaid: string;
  totalPending: string;
  todayPayments: string;

  activeCustomers: number;
  activeProducts: number;
  recentOrders: DashboardRecentOrder[];
};
