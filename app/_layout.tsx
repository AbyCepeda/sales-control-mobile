import "../global.css";

import { store } from "@/src/store/store";
import { Stack } from "expo-router";
import { Provider } from "react-redux";

/**
 * Layout raíz de la app.
 *
 * Beneficio:
 * - Carga Tailwind/NativeWind con global.css.
 * - Hace que Redux esté disponible en toda la app.
 * - Configura navegación principal con Expo Router.
 */
export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}
