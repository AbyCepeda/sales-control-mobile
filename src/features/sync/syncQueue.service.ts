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
 * Lee acciones que todavía necesitan sincronizarse.
 *
 * Para qué sirve:
 * - Incluye PENDING y FAILED.
 *
 * Beneficio:
 * - Si una sincronización automática falló, el usuario puede reintentar
 *   con el botón "Sincronizar".
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

/**
 * Cuenta acciones que todavía no están sincronizadas.
 *
 * Para qué sirve:
 * - Cuenta PENDING y FAILED.
 *
 * Beneficio:
 * - El botón "Sincronizar (1)" coincide con lo que realmente se puede reintentar.
 */
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
