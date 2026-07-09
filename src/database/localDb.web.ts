/**
 * Base local para WEB.
 *
 * Importante:
 * - En navegador evitamos usar expo-sqlite porque puede fallar con WASM.
 * - Para pruebas web usamos localStorage.
 *
 * Beneficio:
 * - Puedes seguir usando Expo Web sin que truene.
 * - En Android/iOS se usará SQLite real con localDb.native.ts.
 */

const STORAGE_KEY = "sales_control_sync_queue";

type WebSyncQueueItem = {
  id: number;
  type: string;
  payload: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

function readQueue(): WebSyncQueueItem[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  const rawQueue = localStorage.getItem(STORAGE_KEY);

  if (!rawQueue) {
    return [];
  }

  try {
    return JSON.parse(rawQueue) as WebSyncQueueItem[];
  } catch {
    return [];
  }
}

function saveQueue(queue: WebSyncQueueItem[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

/**
 * Inicializa la base local web.
 *
 * En web no creamos tablas reales.
 * Solo nos aseguramos de que exista el arreglo en localStorage.
 */
export async function initializeLocalDb() {
  const currentQueue = readQueue();
  saveQueue(currentQueue);
}

/**
 * Simulación mínima de la misma API que usamos en SQLite.
 *
 * Para qué sirve:
 * - Permite que syncQueue.service.ts funcione igual en web y native.
 *
 * Beneficio:
 * - No tenemos que cambiar el código del servicio offline.
 */
export async function getLocalDb() {
  return {
    async execAsync() {
      return;
    },

    async runAsync(sql: string, params: unknown[] = []) {
      const queue = readQueue();
      const normalizedSql = sql.trim().toUpperCase();

      if (normalizedSql.startsWith("INSERT INTO SYNC_QUEUE")) {
        const [type, payload, status, errorMessage, createdAt, updatedAt] =
          params;

        const nextId =
          queue.length > 0 ? Math.max(...queue.map((item) => item.id)) + 1 : 1;

        queue.push({
          id: nextId,
          type: String(type),
          payload: String(payload),
          status: String(status),
          errorMessage: errorMessage ? String(errorMessage) : null,
          createdAt: String(createdAt),
          updatedAt: String(updatedAt),
        });

        saveQueue(queue);
        return;
      }

      if (normalizedSql.startsWith("UPDATE SYNC_QUEUE")) {
        const [status, errorMessage, updatedAt, id] = params;

        const updatedQueue = queue.map((item) =>
          item.id === Number(id)
            ? {
                ...item,
                status: String(status),
                errorMessage: errorMessage ? String(errorMessage) : null,
                updatedAt: String(updatedAt),
              }
            : item,
        );

        saveQueue(updatedQueue);
        return;
      }

      if (normalizedSql.startsWith("DELETE FROM SYNC_QUEUE")) {
        const [status] = params;

        const updatedQueue = queue.filter(
          (item) => item.status !== String(status),
        );

        saveQueue(updatedQueue);
      }
    },

    async getAllAsync<T>(sql: string, params: unknown[] = []) {
      const queue = readQueue();
      const normalizedSql = sql.trim().toUpperCase();

      if (normalizedSql.includes("FROM SYNC_QUEUE")) {
        const [status] = params;

        return queue
          .filter((item) => item.status === String(status))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as T[];
      }

      return [] as T[];
    },

    async getFirstAsync<T>(sql: string, params: unknown[] = []) {
      const queue = readQueue();
      const normalizedSql = sql.trim().toUpperCase();

      if (
        normalizedSql.includes("COUNT(*)") &&
        normalizedSql.includes("FROM SYNC_QUEUE")
      ) {
        const [status] = params;

        const total = queue.filter(
          (item) => item.status === String(status),
        ).length;

        return {
          total,
        } as T;
      }

      return null;
    },
  };
}
