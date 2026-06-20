import type { ApiResponse } from "@/src/features/auth/auth.types";
import type { DashboardSummary } from "@/src/features/dashboard/dashboard.types";
import { api } from "./api";

/**
 * Endpoints del dashboard.
 *
 * Consume:
 * GET /api/dashboard
 */
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<DashboardSummary>, void>({
      query: () => ({
        url: "/dashboard",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
