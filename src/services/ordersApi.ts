import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
    CreateCustomerOrderRequest,
    Order,
} from "@/src/features/orders/order.types";
import { api } from "./api";

/**
 * Endpoints de pedidos.
 *
 * Consume:
 * - GET /api/orders
 * - POST /api/customers/:customerId/orders
 *
 * Beneficio:
 * - Centraliza las peticiones de pedidos.
 * - Usa automáticamente el token desde src/services/api.ts.
 * - Permite crear pedidos con artículos por SKU.
 */
export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Obtiene todos los pedidos visibles para el usuario.
     *
     * ADMIN:
     * - ve todos.
     *
     * SELLER:
     * - ve solo sus pedidos.
     */
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => ({
        url: "/orders",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    /**
     * Crea un pedido para un cliente específico.
     *
     * Nueva lógica:
     * - El customerId va en la URL.
     * - Los artículos van con SKU.
     * - El backend crea productos automáticamente si no existen.
     *
     * Beneficio:
     * - El usuario no registra productos antes.
     * - El pedido alimenta el catálogo automáticamente.
     */
    createCustomerOrder: builder.mutation<
      ApiResponse<Order>,
      CreateCustomerOrderRequest
    >({
      query: ({ customerId, ...body }) => ({
        url: `/customers/${customerId}/orders`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Products", "Dashboard"],
    }),
  }),
});

export const { useGetOrdersQuery, useCreateCustomerOrderMutation } = ordersApi;
