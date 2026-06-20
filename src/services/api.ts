import type { RootState } from "@/src/store/store";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * URL base del backend.
 *
 * IMPORTANTE:
 * - Si pruebas en navegador web: localhost puede funcionar.
 * - Si pruebas en celular físico con Expo Go: localhost NO funciona.
 *
 * En celular debes usar la IP local de tu PC.
 *
 * Ejemplo:
 * const API_BASE_URL = "http://192.168.100.198:3000/api";
 */
const API_BASE_URL = "http://192.168.100.198:3000/api";
/**
 * API principal con RTK Query.
 *
 * Todas las APIs del móvil se van a inyectar desde aquí:
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
     * Aquí agregamos automáticamente el token JWT al header:
     * Authorization: Bearer TOKEN
     */
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),

  /**
   * Tags para manejar caché.
   *
   * Los usaremos después para refrescar datos automáticamente
   * al crear productos, clientes o pedidos.
   */
  tagTypes: ["Auth", "Dashboard", "Products", "Customers", "Orders"],

  endpoints: () => ({}),
});
