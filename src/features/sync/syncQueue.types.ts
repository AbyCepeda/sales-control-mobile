/**
 * Tipos de acciones que podemos guardar para sincronizar después.
 *
 * Por ahora solo usaremos CREATE_ORDER.
 * Después podemos agregar:
 * - UPDATE_ORDER
 * - DELETE_ORDER
 * - CREATE_PAYMENT
 */
export type SyncQueueType = "CREATE_ORDER";

/**
 * Estados de una acción offline.
 *
 * PENDING:
 * - Está esperando sincronizarse.
 *
 * SYNCED:
 * - Ya se envió correctamente al backend.
 *
 * FAILED:
 * - Se intentó sincronizar, pero falló.
 */
export type SyncQueueStatus = "PENDING" | "SYNCED" | "FAILED";

/**
 * Representa un registro guardado en la cola offline.
 */
export type SyncQueueItem = {
  id: number;
  type: SyncQueueType;
  payload: string;
  status: SyncQueueStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};
