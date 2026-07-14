import * as SQLite from "expo-sqlite";

/**
 * Base local nativa usando SQLite.
 *
 * Para qué sirve:
 * - Guardar pedidos pendientes offline en Android/iOS.
 * - Guardar caché local de pedidos descargados desde la API.
 *
 * Beneficio:
 * - En celular físico ya no dependemos de localStorage.
 * - SQLite es más estable para guardar información local en móvil.
 */

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openLocalDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync("sales_control.db");
  }

  return databasePromise;
}

export async function getLocalDb() {
  return openLocalDatabase();
}

export async function initializeLocalDb() {
  const db = await getLocalDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
}

/**
 * Guarda la lista de pedidos en caché local.
 *
 * Para qué sirve:
 * - Mantener una copia de los últimos pedidos descargados.
 *
 * Beneficio:
 * - Si no hay internet, el usuario puede seguir viendo pedidos existentes.
 */
export async function saveCachedOrders<TOrders>(orders: TOrders) {
  const db = await getLocalDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO orders_cache (
      id,
      payload,
      updatedAt
    )
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updatedAt = excluded.updatedAt
    `,
    [1, JSON.stringify(orders), now],
  );
}

/**
 * Lee la caché local de pedidos.
 *
 * Para qué sirve:
 * - Recuperar los pedidos guardados cuando la API falla.
 *
 * Beneficio:
 * - Permite abrir lista y detalle de pedidos en modo offline.
 */
export async function getCachedOrders<TOrders>() {
  const db = await getLocalDb();

  const result = await db.getFirstAsync<{
    payload: string;
  }>(
    `
    SELECT payload
    FROM orders_cache
    WHERE id = ?
    `,
    [1],
  );

  if (!result?.payload) {
    return null;
  }

  try {
    return JSON.parse(result.payload) as TOrders;
  } catch {
    return null;
  }
}
