import { syncPendingOrders } from "@/src/features/sync/syncOrders.service";
import { useEffect, useRef } from "react";

type UseAutoSyncOrdersOptions = {
  onSyncSuccess?: () => void | Promise<void>;
};

/**
 * Hook de sincronización automática para WEB.
 *
 * Para qué sirve:
 * - Escucha cuando el navegador vuelve a tener conexión.
 * - También intenta sincronizar una vez al cargar la pantalla si hay internet.
 *
 * Beneficio:
 * - Evitamos usar NetInfo en web, porque puede fallar con módulos nativos.
 */
export function useAutoSyncOrders(options?: UseAutoSyncOrdersOptions) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    async function runAutoSync() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
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

        console.log("AUTO_SYNC_ORDERS_WEB_RESULT:", result);
      } catch (error) {
        console.error("AUTO_SYNC_ORDERS_WEB_ERROR:", error);
      } finally {
        isSyncingRef.current = false;
      }
    }

    /**
     * Intento inicial:
     * Si abres la pantalla y ya hay internet, intenta sincronizar.
     */
    runAutoSync();

    /**
     * Evento del navegador:
     * Se dispara cuando vuelve la conexión.
     */
    window.addEventListener("online", runAutoSync);

    return () => {
      window.removeEventListener("online", runAutoSync);
    };
  }, [options]);
}
