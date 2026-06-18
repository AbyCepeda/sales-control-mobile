import * as SecureStore from "expo-secure-store";

/**
 * Llave usada para guardar el token en el dispositivo.
 */
const TOKEN_KEY = "sales_control_token";

/**
 * Guarda el token JWT de forma segura.
 *
 * SecureStore es mejor que AsyncStorage para tokens,
 * porque está pensado para datos sensibles.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Obtiene el token guardado en el dispositivo.
 */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Elimina el token guardado.
 *
 * Se usa al cerrar sesión.
 */
export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
