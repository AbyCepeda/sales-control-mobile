import type { ApiResponse } from "@/src/features/auth/auth.types";
import type { DashboardResponse } from "@/src/features/dashboard/dashboard.types";
import { api } from "./api";

/**
 * Endpoints del dashboard.
 *
 * Consume:
 * - GET /api/dashboard
 *
 * Beneficio:
 * - La pantalla Home puede mostrar métricas reales de ventas.
 */
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<DashboardResponse>, void>({
      query: () => ({
        url: "/dashboard",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
