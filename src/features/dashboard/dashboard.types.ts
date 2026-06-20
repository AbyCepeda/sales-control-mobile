export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

export type DashboardCustomer = {
  id: number;
  name: string;
  phone: string | null;
};

export type DashboardSeller = {
  id: number;
  name: string;
  email: string;
};

export type DashboardRecentOrder = {
  id: number;
  total: string;
  status: OrderStatus;
  purchaseDate: string;
  customer: DashboardCustomer;
  seller: DashboardSeller;
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
