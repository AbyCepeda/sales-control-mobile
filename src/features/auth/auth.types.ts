/**
 * Roles que vienen desde el backend.
 *
 * Deben coincidir con el enum UserRole de Prisma:
 * ADMIN | SELLER
 */
export type UserRole = "ADMIN" | "SELLER";

/**
 * Usuario autenticado.
 *
 * Esta estructura debe coincidir con lo que devuelve:
 * - POST /api/auth/login
 * - GET /api/auth/me
 */
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Respuesta estándar del backend.
 *
 * Nuestro backend responde así:
 * {
 *   success: boolean;
 *   message: string;
 *   data: T
 * }
 */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

/**
 * Datos que enviamos al login.
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Data que devuelve el login.
 *
 * Incluye:
 * - token JWT
 * - usuario autenticado
 */
export type LoginData = {
  token: string;
  user: AuthUser;
};

/**
 * Estado local de autenticación en Redux.
 */
export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
};
