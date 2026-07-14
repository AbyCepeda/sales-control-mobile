/**
 * Base local para WEB usando localStorage.
 *
 * Para qué sirve:
 * - Evita problemas de expo-sqlite con WASM en navegador.
 * - Guarda acciones offline y caché de pedidos.
 *
 * Beneficio:
 * - Puedes probar modo offline desde Expo Web.
 */

const SYNC_QUEUE_KEY = "sales_control_sync_queue";
const ORDERS_CACHE_KEY = "sales_control_cached_orders";

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

  const rawQueue = localStorage.getItem(SYNC_QUEUE_KEY);

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

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export async function initializeLocalDb() {
  console.log("LOCAL_DB_WEB_LOCALSTORAGE_INIT");

  const currentQueue = readQueue();
  saveQueue(currentQueue);
}

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

export async function saveCachedOrders<TOrders>(orders: TOrders) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
}

export async function getCachedOrders<TOrders>() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const rawOrders = localStorage.getItem(ORDERS_CACHE_KEY);

  if (!rawOrders) {
    return null;
  }

  try {
    return JSON.parse(rawOrders) as TOrders;
  } catch {
    return null;
  }
}
