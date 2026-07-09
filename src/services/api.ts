import type { RootState } from "@/src/store/store";
import { getToken } from "@/src/utils/tokenStorage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * URL base del backend.
 *
 * Para qué sirve:
 * - Centraliza la URL de la API.
 * - Permite cambiar entre API local y API publicada sin tocar código.
 *
 * Beneficio:
 * - En desarrollo puedes usar tu backend local.
 * - En producción puedes usar Vercel.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL no está configurada.");
}
/**
 * API principal con RTK Query.
 *
 * Todas las APIs del móvil se inyectan desde aquí:
 * - authApi
 * - dashboardApi
 * - productsApi
 * - customersApi
 * - ordersApi
 */
export const api = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,

    /**
     * prepareHeaders se ejecuta antes de cada petición.
     *
     * Nueva mejora:
     * 1. Primero intenta obtener el token desde Redux.
     * 2. Si Redux todavía no lo tiene, intenta leerlo desde storage.
     *
     * Beneficio:
     * - Evita errores 401 cuando recargas la página web.
     * - Evita que /api/orders se mande sin Authorization.
     */
    prepareHeaders: async (headers, { getState }) => {
      const state = getState() as RootState;

      /**
       * Token en memoria Redux.
       */
      let token = state.auth.token;

      /**
       * Fallback:
       * Si Redux todavía no tiene token, lo buscamos en storage.
       *
       * En web:
       * - localStorage
       *
       * En móvil:
       * - SecureStore
       */
      if (!token) {
        token = await getToken();
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  /**
   * Tags para manejar caché.
   *
   * Beneficio:
   * - Permite refrescar listas automáticamente
   *   al crear productos, clientes o pedidos.
   */
  tagTypes: ["Auth", "Dashboard", "Products", "Customers", "Orders"],

  endpoints: () => ({}),
});
