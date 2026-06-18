import authReducer from "@/src/features/auth/auth.slice";
import { configureStore } from "@reduxjs/toolkit";
import { api } from "../services/api";

/**
 * Store global de Redux.
 *
 * Aquí conectamos:
 * - auth: estado de sesión
 * - api: RTK Query
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },

  /**
   * Middleware de RTK Query.
   *
   * Es necesario para que RTK Query maneje:
   * - cache
   * - loading
   * - errores
   * - refetch
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

/**
 * Tipo global del estado.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Tipo global del dispatch.
 */
export type AppDispatch = typeof store.dispatch;
