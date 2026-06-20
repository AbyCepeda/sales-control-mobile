import { Platform } from "react-native";

/**
 * Llave usada para guardar el token.
 */
const TOKEN_KEY = "sales_control_token";

/**
 * Token temporal en memoria para móvil.
 *
 * Beneficio:
 * - Evita cargar expo-secure-store mientras resolvemos el error móvil.
 * - Funciona en Expo Go.
 *
 * Nota:
 * - En móvil el token se pierde si cierras completamente la app.
 * - En web sí se conserva con localStorage.
 */
let memoryToken: string | null = null;

/**
 * Guarda el token JWT.
 *
 * Web:
 * - localStorage
 *
 * Móvil:
 * - memoria temporal
 */
export async function saveToken(token: string): Promise<void> {
  memoryToken = token;

  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Obtiene el token guardado.
 */
export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return memoryToken;
}

/**
 * Elimina el token guardado al cerrar sesión.
 */
export async function removeToken(): Promise<void> {
  memoryToken = null;

  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
  }
}
