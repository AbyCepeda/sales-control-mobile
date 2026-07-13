import {
    deleteSyncedSyncQueueItems,
    getPendingSyncQueueItems,
    updateSyncQueueItemStatus,
} from "@/src/features/sync/syncQueue.service";
import { getToken } from "@/src/utils/tokenStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_BASE_URL no está configurada.");
}

/**
 * Resultado de sincronización.
 *
 * Para qué sirve:
 * - Saber cuántos pedidos se sincronizaron bien.
 * - Saber cuántos fallaron.
 *
 * Beneficio:
 * - Podemos mostrar un mensaje claro al usuario.
 */
export type SyncPendingOrdersResult = {
  total: number;
  synced: number;
  failed: number;
};

/**
 * Sincroniza pedidos pendientes guardados offline.
 *
 * Para qué sirve:
 * - Lee la cola local sync_queue.
 * - Toma acciones CREATE_ORDER pendientes.
 * - Las manda al backend cuando ya hay conexión.
 *
 * Beneficio:
 * - Los pedidos capturados sin internet terminan guardándose en Neon.
 */
export async function syncPendingOrders(): Promise<SyncPendingOrdersResult> {
  const pendingItems = await getPendingSyncQueueItems();

  const createOrderItems = pendingItems.filter(
    (item) => item.type === "CREATE_ORDER",
  );

  const token = await getToken();

  if (!token) {
    throw new Error("No hay token de sesión. Inicia sesión de nuevo.");
  }

  let synced = 0;
  let failed = 0;

  for (const item of createOrderItems) {
    try {
      const payload = JSON.parse(item.payload);

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Error ${response.status}: ${
            errorText || "No se pudo sincronizar el pedido."
          }`,
        );
      }

      await updateSyncQueueItemStatus(item.id, "SYNCED", null);
      synced += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido al sincronizar.";

      await updateSyncQueueItemStatus(item.id, "FAILED", message);
      failed += 1;
    }
  }

  /**
   * Limpiamos los sincronizados.
   *
   * Para qué sirve:
   * - Borra de la cola los pedidos que ya llegaron al backend.
   *
   * Beneficio:
   * - Evita reenviar pedidos duplicados.
   */
  await deleteSyncedSyncQueueItems();

  return {
    total: createOrderItems.length,
    synced,
    failed,
  };
}
