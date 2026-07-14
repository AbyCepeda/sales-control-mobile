import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Hook para detectar conexión en Android/iOS.
 *
 * Para qué sirve:
 * - Usa NetInfo para saber si el celular tiene internet.
 *
 * Beneficio:
 * - No usamos window/navigator en Android porque ahí no existen.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasInternet =
        state.isConnected === true && state.isInternetReachable !== false;

      setIsOnline(hasInternet);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
