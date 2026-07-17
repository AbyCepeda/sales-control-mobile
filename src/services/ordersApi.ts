import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
  CreateOrderPaymentRequest,
  CreateOrderRequest,
  Order,
  OrderPaymentSummary,
  UpdateFullOrderRequest,
  UpdateOrderRequest,
} from "@/src/features/orders/order.types";
import { api } from "./api";

/**
 * Endpoints de pedidos.
 *
 * Consume:
 * - GET /api/orders
 * - POST /api/orders
 * - GET /api/orders/:id
 * - PUT /api/orders/:id
 * - PUT /api/orders/:id/full
 * - POST /api/orders/:id/payments
 * - GET /api/orders/:id/payments/summary
 */
export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => ({
        url: "/orders",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    getOrderById: builder.query<ApiResponse<Order>, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),

    createOrder: builder.mutation<ApiResponse<Order>, CreateOrderRequest>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Products", "Dashboard", "Customers"],
    }),

    updateOrder: builder.mutation<
      ApiResponse<Order>,
      { id: number; body: UpdateOrderRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
        "Dashboard",
      ],
    }),

    updateFullOrder: builder.mutation<
      ApiResponse<Order>,
      { id: number; body: UpdateFullOrderRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/full`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
        "Dashboard",
        "Products",
        "Customers",
      ],
    }),

    /**
     * Registra un pago o abono.
     *
     * Para qué sirve:
     * - Permite guardar pagos parciales o completos.
     *
     * Beneficio:
     * - El pedido puede mostrar total, pagado y pendiente.
     */
    createOrderPayment: builder.mutation<
      ApiResponse<Order>,
      { id: number; body: CreateOrderPaymentRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
        "Dashboard",
      ],
    }),

    /**
     * Obtiene resumen de pagos del pedido.
     */
    getOrderPaymentSummary: builder.query<
      ApiResponse<OrderPaymentSummary>,
      number
    >({
      query: (id) => ({
        url: `/orders/${id}/payments/summary`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateFullOrderMutation,
  useCreateOrderPaymentMutation,
  useGetOrderPaymentSummaryQuery,
} = ordersApi;
