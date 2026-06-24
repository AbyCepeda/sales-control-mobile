import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
  CreateOrderRequest,
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
 * Beneficio:
 * - Centraliza todas las peticiones de pedidos.
 * - Permite crear y editar pedidos completos.
 */
export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Obtiene todos los pedidos visibles para el usuario.
     */
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => ({
        url: "/orders",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    /**
     * Obtiene el detalle completo de un pedido.
     *
     * Beneficio:
     * - Nos sirve para la pantalla /orders/:id.
     */
    getOrderById: builder.query<ApiResponse<Order>, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),

    /**
     * Crea un pedido nuevo.
     */
    createOrder: builder.mutation<ApiResponse<Order>, CreateOrderRequest>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Products", "Dashboard", "Customers"],
    }),

    /**
     * Edita datos básicos del pedido.
     *
     * Permite:
     * - status
     * - deliveryDate
     * - notes
     */
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

    /**
     * Edita un pedido completo.
     *
     * Permite:
     * - agregar clientes
     * - quitar clientes
     * - agregar artículos
     * - quitar artículos
     * - cambiar cantidades/precios
     *
     * Beneficio:
     * - El usuario puede entrar al detalle del pedido y modificarlo completo.
     */
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
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateFullOrderMutation,
} = ordersApi;
