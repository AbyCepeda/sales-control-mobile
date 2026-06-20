import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
    CreateProductRequest,
    Product,
    UpdateProductRequest,
} from "@/src/features/products/product.types";
import { api } from "./api";

/**
 * Endpoints de productos.
 *
 * Consume:
 * - GET /api/products
 * - POST /api/products
 * - PUT /api/products/:id
 * - DELETE /api/products/:id
 */
export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Obtiene todos los productos.
     *
     * El token se manda automáticamente desde src/services/api.ts.
     */
    getProducts: builder.query<ApiResponse<Product[]>, void>({
      query: () => ({
        url: "/products",
        method: "GET",
      }),
      providesTags: ["Products"],
    }),

    /**
     * Crea un producto.
     *
     * Solo ADMIN debería poder usar esto según el backend.
     */
    createProduct: builder.mutation<ApiResponse<Product>, CreateProductRequest>(
      {
        query: (body) => ({
          url: "/products",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Products", "Dashboard"],
      },
    ),

    /**
     * Actualiza un producto por ID.
     */
    updateProduct: builder.mutation<
      ApiResponse<Product>,
      { id: number; body: UpdateProductRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Products", "Dashboard"],
    }),

    /**
     * Desactiva un producto.
     *
     * Nuestro backend no borra físicamente, solo cambia isActive.
     */
    deactivateProduct: builder.mutation<ApiResponse<Product>, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "Dashboard"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeactivateProductMutation,
} = productsApi;
