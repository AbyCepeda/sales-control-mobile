import { syncPendingOrders } from "@/src/features/sync/syncOrders.service";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useRef } from "react";

type UseAutoSyncOrdersOptions = {
  onSyncSuccess?: () => void | Promise<void>;
};

/**
 * Hook para sincronizar pedidos automáticamente cuando vuelve internet.
 *
 * Para qué sirve:
 * - Escucha cambios de conexión.
 * - Si hay internet, intenta subir pedidos pendientes.
 *
 * Beneficio:
 * - El usuario no depende únicamente del botón "Sincronizar".
 */
export function useAutoSyncOrders(options?: UseAutoSyncOrdersOptions) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const hasInternet =
        state.isConnected === true && state.isInternetReachable !== false;

      if (!hasInternet) {
        return;
      }

      if (isSyncingRef.current) {
        return;
      }

      try {
        isSyncingRef.current = true;

        const result = await syncPendingOrders();

        if (result.synced > 0) {
          await options?.onSyncSuccess?.();
        }

        console.log("AUTO_SYNC_ORDERS_RESULT:", result);
      } catch (error) {
        console.error("AUTO_SYNC_ORDERS_ERROR:", error);
      } finally {
        isSyncingRef.current = false;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [options]);
}
