import { finishLoadingSession, setToken } from "@/src/features/auth/auth.slice";
import { useAppDispatch } from "@/src/store/hooks";
import { getToken } from "@/src/utils/tokenStorage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

/**
 * Pantalla inicial.
 *
 * Beneficio:
 * - Revisa si hay token guardado.
 * - Evita mandar siempre al login si ya existe sesión.
 */
export default function IndexScreen() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const token = await getToken();

        if (token) {
          dispatch(setToken(token));
          router.replace("/(tabs)");
          return;
        }

        dispatch(finishLoadingSession());
        router.replace("/login");
      } catch (error) {
        console.error("BOOTSTRAP_SESSION_ERROR:", error);
        dispatch(finishLoadingSession());
        router.replace("/login");
      }
    }

    bootstrapSession();
  }, [dispatch]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
    </View>
  );
}
