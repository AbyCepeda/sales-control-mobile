import { initializeLocalDb } from "@/src/database/localDb";
import "../global.css";

import { store } from "@/src/store/store";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import { Provider } from "react-redux";

/**
 * Oculta logs esperados durante pruebas offline.
 *
 * Para qué sirve:
 * - Evita que React Native muestre pantalla roja por logs viejos o esperados.
 *
 * Beneficio:
 * - Si falla la conexión al crear un pedido, se maneja con toast/offline,
 *   no con pantalla roja.
 */
LogBox.ignoreLogs(["CREATE_ORDER_ERROR", "Network request failed"]);

/**
 * Layout raíz de la app.
 *
 * Beneficio:
 * - Carga Tailwind/NativeWind con global.css.
 * - Hace que Redux esté disponible en toda la app.
 * - Configura navegación principal con Expo Router.
 * - Inicializa la base local SQLite/localStorage para modo offline.
 */
export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  useEffect(() => {
    /**
     * Inicializa la base local al arrancar la app.
     *
     * Para qué sirve:
     * - En Android/iOS prepara SQLite.
     * - En web prepara localStorage.
     *
     * Beneficio:
     * - La app queda lista para guardar acciones offline.
     */
    async function prepareLocalDatabase() {
      try {
        await initializeLocalDb();
      } catch (error) {
        console.log("LOCAL_DB_INIT_ERROR:", error);
      } finally {
        setIsDatabaseReady(true);
      }
    }

    prepareLocalDatabase();
  }, []);

  /**
   * Mientras la base local se prepara, mostramos una pantalla de carga.
   *
   * Beneficio:
   * - Evitamos que la app intente usar la BD local antes de que exista.
   */
  if (!isDatabaseReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}
