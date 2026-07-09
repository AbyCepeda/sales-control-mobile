import { initializeLocalDb } from "@/src/database/localDb";
import "../global.css";

import { store } from "@/src/store/store";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Provider } from "react-redux";

/**
 * Layout raíz de la app.
 *
 * Beneficio:
 * - Carga Tailwind/NativeWind con global.css.
 * - Hace que Redux esté disponible en toda la app.
 * - Configura navegación principal con Expo Router.
 * - Inicializa la base local SQLite para modo offline.
 */
export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  useEffect(() => {
    /**
     * Inicializa SQLite al arrancar la app.
     *
     * Para qué sirve:
     * - Crea la tabla sync_queue si todavía no existe.
     *
     * Beneficio:
     * - La app queda preparada para guardar acciones offline.
     */
    async function prepareLocalDatabase() {
      try {
        await initializeLocalDb();
      } catch (error) {
        console.error("LOCAL_DB_INIT_ERROR:", error);
      } finally {
        setIsDatabaseReady(true);
      }
    }

    prepareLocalDatabase();
  }, []);

  /**
   * Mientras SQLite se prepara, mostramos una pantalla de carga.
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
