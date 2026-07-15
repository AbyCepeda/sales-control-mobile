import { getLocalDb } from "@/src/database/localDb";
import type {
  SyncQueueItem,
  SyncQueueStatus,
  SyncQueueType,
} from "@/src/features/sync/syncQueue.types";

export async function addSyncQueueItem<TPayload>(
  type: SyncQueueType,
  payload: TPayload,
) {
  const db = await getLocalDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO sync_queue (
      type,
      payload,
      status,
      errorMessage,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [type, JSON.stringify(payload), "PENDING", null, now, now],
  );
}

/**
 * Agrega o reemplaza una edición offline de pedido.
 *
 * Para qué sirve:
 * - Evita varios UPDATE_ORDER del mismo pedido.
 * - Conserva solo la última versión editada.
 *
 * Beneficio:
 * - Si editas el mismo pedido varias veces sin internet,
 *   solo se sincroniza la última versión.
 *
 * Importante:
 * - Esto NO limita artículos.
 * - El payload puede traer varios clientes y varios artículos.
 */
export async function addOrReplaceUpdateOrderQueueItem<
  TPayload extends {
    id: number;
    body: unknown;
  },
>(payload: TPayload) {
  const pendingItems = await getPendingSyncQueueItems();

  const existingUpdateItem = pendingItems.find((item) => {
    if (item.type !== "UPDATE_ORDER") {
      return false;
    }

    try {
      const currentPayload = JSON.parse(item.payload) as {
        id: number;
      };

      return currentPayload.id === payload.id;
    } catch {
      return false;
    }
  });

  if (existingUpdateItem) {
    const db = await getLocalDb();
    const now = new Date().toISOString();

    await db.runAsync(
      `
      UPDATE sync_queue
      SET
        payload = ?,
        status = ?,
        errorMessage = ?,
        updatedAt = ?
      WHERE id = ?
      `,
      [JSON.stringify(payload), "PENDING", null, now, existingUpdateItem.id],
    );

    return;
  }

  await addSyncQueueItem("UPDATE_ORDER", payload);
}

/**
 * Lee acciones que necesitan sincronizarse.
 *
 * Incluye:
 * - PENDING
 * - FAILED
 */
export async function getPendingSyncQueueItems() {
  const db = await getLocalDb();

  return db.getAllAsync<SyncQueueItem>(
    `
    SELECT
      id,
      type,
      payload,
      status,
      errorMessage,
      createdAt,
      updatedAt
    FROM sync_queue
    WHERE status IN (?, ?)
    ORDER BY createdAt ASC
    `,
    ["PENDING", "FAILED"],
  );
}

export async function updateSyncQueueItemStatus(
  id: number,
  status: SyncQueueStatus,
  errorMessage: string | null = null,
) {
  const db = await getLocalDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    UPDATE sync_queue
    SET
      status = ?,
      errorMessage = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [status, errorMessage, now, id],
  );
}

export async function deleteSyncedSyncQueueItems() {
  const db = await getLocalDb();

  await db.runAsync(
    `
    DELETE FROM sync_queue
    WHERE status = ?
    `,
    ["SYNCED"],
  );
}

export async function countPendingSyncQueueItems() {
  const db = await getLocalDb();

  const result = await db.getFirstAsync<{
    total: number;
  }>(
    `
    SELECT COUNT(*) as total
    FROM sync_queue
    WHERE status IN (?, ?)
    `,
    ["PENDING", "FAILED"],
  );

  return result?.total ?? 0;
}
