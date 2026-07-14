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
 * Payload para sincronizar una edición completa de pedido.
 *
 * Para qué sirve:
 * - Guardar el ID del pedido que se editó.
 * - Guardar el body que se mandará al endpoint full update.
 *
 * Beneficio:
 * - Podemos editar pedidos sin internet y subir los cambios después.
 */
type UpdateOrderSyncPayload = {
  id: number;
  body: unknown;
};

/**
 * Resultado de sincronización.
 *
 * Para qué sirve:
 * - Saber cuántas acciones offline se encontraron.
 * - Saber cuántas se sincronizaron bien.
 * - Saber cuántas fallaron.
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
 * Envía una acción CREATE_ORDER al backend.
 *
 * Para qué sirve:
 * - Crear en Neon un pedido que fue capturado sin internet.
 *
 * Beneficio:
 * - Los pedidos offline terminan guardándose en la base real.
 */
async function syncCreateOrder(payload: unknown, token: string) {
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
}

/**
 * Envía una acción UPDATE_ORDER al backend.
 *
 * Para qué sirve:
 * - Subir cambios de un pedido editado sin internet.
 *
 * Beneficio:
 * - El usuario puede modificar artículos/clientes offline y sincronizar después.
 */
async function syncUpdateOrder(payload: UpdateOrderSyncPayload, token: string) {
  const response = await fetch(`${API_BASE_URL}/orders/${payload.id}/full`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload.body),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error ${response.status}: ${
        errorText || "No se pudo sincronizar la edición del pedido."
      }`,
    );
  }
}

/**
 * Sincroniza acciones pendientes guardadas offline.
 *
 * Para qué sirve:
 * - Lee la cola local sync_queue.
 * - Sincroniza CREATE_ORDER.
 * - Sincroniza UPDATE_ORDER.
 *
 * Beneficio:
 * - Los pedidos nuevos y las ediciones hechas sin internet
 *   terminan guardándose en Vercel/Neon cuando vuelve la conexión.
 */
export async function syncPendingOrders(): Promise<SyncPendingOrdersResult> {
  const pendingItems = await getPendingSyncQueueItems();

  /**
   * Solo tomamos acciones de pedidos.
   *
   * Para qué sirve:
   * - De momento nuestra cola solo maneja pedidos.
   *
   * Beneficio:
   * - Más adelante podemos agregar otros tipos sin romper esta lógica.
   */
  const orderItems = pendingItems.filter((item) => {
    return item.type === "CREATE_ORDER" || item.type === "UPDATE_ORDER";
  });

  const token = await getToken();

  if (!token) {
    throw new Error("No hay token de sesión. Inicia sesión de nuevo.");
  }

  let synced = 0;
  let failed = 0;

  for (const item of orderItems) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.type === "CREATE_ORDER") {
        await syncCreateOrder(payload, token);
      }

      if (item.type === "UPDATE_ORDER") {
        await syncUpdateOrder(payload as UpdateOrderSyncPayload, token);
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
   * - Borra de la cola las acciones que ya llegaron al backend.
   *
   * Beneficio:
   * - Evita reenviar pedidos o ediciones duplicadas.
   */
  await deleteSyncedSyncQueueItems();

  return {
    total: orderItems.length,
    synced,
    failed,
  };
}
