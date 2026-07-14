import { useEffect, useState } from "react";

/**
 * Hook para detectar conexión en WEB.
 *
 * Para qué sirve:
 * - Revisa si el navegador tiene conexión usando navigator.onLine.
 *
 * Beneficio:
 * - Podemos mostrar avisos visuales sin usar NetInfo en web.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === "undefined") {
      return true;
    }

    return navigator.onLine;
  });

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
