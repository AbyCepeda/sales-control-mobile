import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser } from "./auth.types";

/**
 * Estado inicial de autenticación.
 *
 * token: null porque al abrir la app todavía no sabemos si hay sesión.
 * user: null porque todavía no hay usuario cargado.
 * isAuthenticated: false porque aún no validamos login.
 * isLoadingSession: true porque después revisaremos si hay token guardado.
 */
const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoadingSession: true,
};

/**
 * Slice de autenticación.
 *
 * Aquí guardamos la sesión del usuario en memoria:
 * - token
 * - user
 * - estado autenticado/no autenticado
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Guarda token y usuario después de un login correcto.
     */
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        user: AuthUser;
      }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoadingSession = false;
    },

    /**
     * Guarda solo el token.
     *
     * Esto nos servirá cuando carguemos un token desde SecureStore
     * antes de llamar a /auth/me.
     */
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },

    /**
     * Actualiza el usuario autenticado.
     *
     * Se usa después de validar sesión con /auth/me.
     */
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoadingSession = false;
    },

    /**
     * Marca que ya terminó la revisión de sesión.
     *
     * Sirve para evitar redirigir antes de saber si había token guardado.
     */
    finishLoadingSession: (state) => {
      state.isLoadingSession = false;
    },

    /**
     * Cierra sesión.
     *
     * Limpia token y usuario del estado global.
     */
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoadingSession = false;
    },
  },
});

export const {
  setCredentials,
  setToken,
  setUser,
  finishLoadingSession,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
