/**
 * Tipos de acciones que podemos guardar para sincronizar después.
 *
 * CREATE_ORDER:
 * - Pedido nuevo creado sin internet.
 *
 * UPDATE_ORDER:
 * - Pedido existente editado sin internet.
 */
export type SyncQueueType = "CREATE_ORDER" | "UPDATE_ORDER";

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
 * - Puede volver a intentarse después.
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
