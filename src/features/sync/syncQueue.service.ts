import { getLocalDb } from "@/src/database/localDb";
import type {
    SyncQueueItem,
    SyncQueueStatus,
    SyncQueueType,
} from "@/src/features/sync/syncQueue.types";

/**
 * Agrega una acción a la cola offline.
 *
 * Para qué sirve:
 * - Guarda localmente algo que se debe enviar al backend después.
 *
 * Beneficio:
 * - Si no hay internet o falla la API, no perdemos la información.
 */
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
 * Obtiene acciones pendientes de sincronizar.
 *
 * Para qué sirve:
 * - Leer lo que todavía no se ha mandado al backend.
 *
 * Beneficio:
 * - Luego podremos recorrer esta lista y sincronizarla.
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
    WHERE status = ?
    ORDER BY createdAt ASC
    `,
    ["PENDING"],
  );
}

/**
 * Cambia el estado de una acción de la cola.
 *
 * Para qué sirve:
 * - Marcar una acción como sincronizada o fallida.
 *
 * Beneficio:
 * - Evitamos reenviar acciones que ya se sincronizaron correctamente.
 */
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

/**
 * Elimina acciones que ya fueron sincronizadas.
 *
 * Para qué sirve:
 * - Limpiar la cola local.
 *
 * Beneficio:
 * - Evita que la base local crezca innecesariamente.
 */
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
 * Cuenta cuántas acciones siguen pendientes.
 *
 * Para qué sirve:
 * - Mostrar después un badge o alerta tipo:
 *   "Tienes 3 pedidos pendientes por sincronizar".
 *
 * Beneficio:
 * - El usuario sabrá si hay datos guardados offline.
 */
export async function countPendingSyncQueueItems() {
  const db = await getLocalDb();

  const result = await db.getFirstAsync<{
    total: number;
  }>(
    `
    SELECT COUNT(*) as total
    FROM sync_queue
    WHERE status = ?
    `,
    ["PENDING"],
  );

  return result?.total ?? 0;
}
