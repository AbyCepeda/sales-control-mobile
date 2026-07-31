import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
  CreateCustomerOrderPaymentRequest,
  CreateOrderRequest,
  CustomerOrderPaymentSummary,
  Order,
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
 *
 * Nueva lógica de pagos:
 * - POST /api/customer-orders/:customerOrderId/payments
 * - GET /api/customer-orders/:customerOrderId/payments/summary
 * - DELETE /api/customer-order-payments/:paymentId
 *
 * Beneficio:
 * - Los abonos se registran por cliente dentro del pedido.
 * - Ya no se mezclan pagos de diferentes clientes.
 * - Si un abono se capturó mal, se puede eliminar.
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
     * Registra un pago o abono para un cliente dentro del pedido.
     *
     * Para qué sirve:
     * - Guarda pagos parciales o completos de un CustomerOrder.
     *
     * Beneficio:
     * - Sabemos qué cliente pagó.
     * - El backend devuelve el pedido actualizado.
     */
    createCustomerOrderPayment: builder.mutation<
      ApiResponse<Order>,
      { customerOrderId: number; body: CreateCustomerOrderPaymentRequest }
    >({
      query: ({ customerOrderId, body }) => ({
        url: `/customer-orders/${customerOrderId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => {
        const orderId = result?.data?.id;

        return orderId
          ? ["Orders", { type: "Orders", id: orderId }, "Dashboard"]
          : ["Orders", "Dashboard"];
      },
    }),

    /**
     * Elimina un abono registrado.
     *
     * Para qué sirve:
     * - Corrige pagos capturados por error.
     *
     * Beneficio:
     * - El backend recalcula el estado del cliente y del pedido.
     */
    deleteCustomerOrderPayment: builder.mutation<ApiResponse<Order>, number>({
      query: (paymentId) => ({
        url: `/customer-order-payments/${paymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => {
        const orderId = result?.data?.id;

        return orderId
          ? ["Orders", { type: "Orders", id: orderId }, "Dashboard"]
          : ["Orders", "Dashboard"];
      },
    }),

    /**
     * Obtiene resumen de pagos de un cliente dentro del pedido.
     */
    getCustomerOrderPaymentSummary: builder.query<
      ApiResponse<CustomerOrderPaymentSummary>,
      number
    >({
      query: (customerOrderId) => ({
        url: `/customer-orders/${customerOrderId}/payments/summary`,
        method: "GET",
      }),
      providesTags: (_result, _error, customerOrderId) => [
        { type: "Orders", id: `customer-order-${customerOrderId}` },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateFullOrderMutation,
  useCreateCustomerOrderPaymentMutation,
  useDeleteCustomerOrderPaymentMutation,
  useGetCustomerOrderPaymentSummaryQuery,
} = ordersApi;
