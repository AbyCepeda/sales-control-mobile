import { finishLoadingSession, setToken } from "@/src/features/auth/auth.slice";
import { useAppDispatch } from "@/src/store/hooks";
import { getToken } from "@/src/utils/tokenStorage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Pantalla inicial.
 *
 * Su trabajo es revisar si existe un token guardado.
 *
 * Si hay token:
 * - lo guarda en Redux
 * - manda al dashboard
 *
 * Si no hay token:
 * - manda al login
 */
export default function IndexScreen() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function bootstrapSession() {
      try {
        /**
         * Buscamos token guardado en SecureStore.
         */
        const token = await getToken();

        if (token) {
          /**
           * Guardamos token en Redux.
           *
           * Más adelante podemos validar con /auth/me antes de mandar
           * al dashboard. Por ahora ya dejamos la base preparada.
           */
          dispatch(setToken(token));
          router.replace("/(tabs)");
          return;
        }

        /**
         * Si no hay token, mandamos al login.
         */
        dispatch(finishLoadingSession());
        router.replace("/login");
      } catch (error) {
        /**
         * Si algo falla leyendo SecureStore, no dejamos la app atorada.
         */
        console.error("BOOTSTRAP_SESSION_ERROR:", error);
        dispatch(finishLoadingSession());
        router.replace("/login");
      }
    }

    bootstrapSession();
  }, [dispatch]);

  /**
   * Mientras revisamos sesión mostramos loader.
   */
  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
