import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser } from "./auth.types";

type CredentialsPayload = {
  token: string;
  user: AuthUser;
};

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoadingSession: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    startLoadingSession(state) {
      state.isLoadingSession = true;
    },

    finishLoadingSession(state) {
      state.isLoadingSession = false;
    },

    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },

    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },

    setCredentials(state, action: PayloadAction<CredentialsPayload>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoadingSession = false;
    },

    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoadingSession = false;
    },
  },
});

export const {
  startLoadingSession,
  finishLoadingSession,
  setToken,
  setUser,
  setCredentials,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
