import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
    CreateCustomerRequest,
    Customer,
    UpdateCustomerRequest,
} from "@/src/features/customers/customer.types";
import { api } from "./api";

/**
 * Endpoints de clientes.
 *
 * Consume:
 * - GET /api/customers
 * - POST /api/customers
 * - PUT /api/customers/:id
 * - DELETE /api/customers/:id
 *
 * Beneficio:
 * - Centraliza las peticiones de clientes.
 * - Usa automáticamente el token desde src/services/api.ts.
 * - Permite usar clientes en la pantalla de pedidos.
 */
export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Obtiene clientes activos.
     *
     * Beneficio:
     * - Permite seleccionar a quién pertenece un pedido.
     */
    getCustomers: builder.query<ApiResponse<Customer[]>, void>({
      query: () => ({
        url: "/customers",
        method: "GET",
      }),
      providesTags: ["Customers"],
    }),

    /**
     * Crea un cliente.
     *
     * Beneficio:
     * - Si llega una persona nueva, se puede registrar antes de hacerle pedido.
     */
    createCustomer: builder.mutation<
      ApiResponse<Customer>,
      CreateCustomerRequest
    >({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),

    /**
     * Actualiza un cliente.
     *
     * Beneficio:
     * - Permite corregir nombre, teléfono o dirección.
     */
    updateCustomer: builder.mutation<
      ApiResponse<Customer>,
      { id: number; body: UpdateCustomerRequest }
    >({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),

    /**
     * Desactiva un cliente.
     *
     * Importante:
     * - No se borra físicamente.
     * - Así no perdemos historial de pedidos.
     */
    deactivateCustomer: builder.mutation<ApiResponse<Customer>, number>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeactivateCustomerMutation,
} = customersApi;
