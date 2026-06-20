import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Llave usada para guardar el token.
 *
 * En móvil se guarda con SecureStore.
 * En web se guarda con localStorage.
 */
const TOKEN_KEY = "sales_control_token";

/**
 * Verifica si estamos en navegador.
 *
 * Beneficio:
 * - Evita llamar SecureStore en web.
 * - Previene errores como:
 *   getValueWithKeyAsync is not a function
 */
function isWeb() {
  return Platform.OS === "web";
}

/**
 * Guarda el token JWT.
 *
 * Móvil:
 * - SecureStore
 *
 * Web:
 * - localStorage
 */
export async function saveToken(token: string): Promise<void> {
  if (isWeb()) {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Obtiene el token guardado.
 */
export async function getToken(): Promise<string | null> {
  if (isWeb()) {
    return localStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Elimina el token guardado al cerrar sesión.
 */
export async function removeToken(): Promise<void> {
  if (isWeb()) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
