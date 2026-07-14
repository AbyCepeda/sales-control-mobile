import { syncPendingOrders } from "@/src/features/sync/syncOrders.service";
import { useEffect, useRef } from "react";

type UseAutoSyncOrdersOptions = {
  onSyncSuccess?: () => void | Promise<void>;
};

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

        console.log("AUTO_SYNC_ORDERS_RESULT:", result);
      } catch (error) {
        console.log("AUTO_SYNC_ORDERS_ERROR:", error);
      } finally {
        isSyncingRef.current = false;
      }
    }

    runAutoSync();

    if (typeof window !== "undefined") {
      window.addEventListener("online", runAutoSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", runAutoSync);
      }
    };
  }, [options]);
}
