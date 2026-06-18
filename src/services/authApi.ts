import type {
    ApiResponse,
    AuthUser,
    LoginData,
    LoginRequest,
} from "@/src/features/auth/auth.types";
import { api } from "./api";

/**
 * Endpoints de autenticación usando RTK Query.
 */
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/auth/login
     *
     * Envía email y password.
     * Recibe token y usuario autenticado.
     */
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    /**
     * GET /api/auth/me
     *
     * Valida el token actual y devuelve el usuario autenticado.
     */
    me: builder.query<ApiResponse<AuthUser>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
  }),
});

/**
 * Hooks generados automáticamente por RTK Query.
 *
 * Los usaremos en pantallas:
 * - useLoginMutation()
 * - useMeQuery()
 */
export const { useLoginMutation, useMeQuery } = authApi;
