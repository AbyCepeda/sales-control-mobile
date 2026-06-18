import "../global.css";

import { store } from "@/src/store/store";
import { Stack } from "expo-router";
import { Provider } from "react-redux";

/**
 * Layout raíz de la aplicación.
 *
 * Aquí conectamos:
 * - NativeWind/Tailwind mediante global.css
 * - Redux mediante Provider
 * - Expo Router mediante Stack
 */
export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}
