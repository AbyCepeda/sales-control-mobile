import type { ApiResponse } from "@/src/features/auth/auth.types";
import type {
    CreateUserRequest,
    UpdateUserRequest,
    UpdateUserStatusRequest,
    User,
} from "@/src/features/users/user.types";
import { api } from "./api";

/**
 * Endpoints de usuarios.
 *
 * Consume:
 * - GET /api/users
 * - POST /api/users
 * - PUT /api/users/:id
 * - PATCH /api/users/:id/status
 *
 * Beneficio:
 * - ADMIN puede administrar vendedores desde la app.
 */
export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<User[]>, void>({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    createUser: builder.mutation<ApiResponse<User>, CreateUserRequest>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users", "Dashboard"],
    }),

    updateUser: builder.mutation<
      ApiResponse<User>,
      { id: number; body: UpdateUserRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Users", "Dashboard"],
    }),

    updateUserStatus: builder.mutation<
      ApiResponse<User>,
      { id: number; body: UpdateUserStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Users", "Dashboard"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
