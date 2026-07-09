import * as SQLite from "expo-sqlite";

/**
 * Nombre de la base de datos local.
 *
 * Para qué sirve:
 * - Guarda información offline dentro del dispositivo.
 *
 * Beneficio:
 * - La app podrá conservar pedidos aunque no tenga internet.
 */
const DATABASE_NAME = "sales_control_local.db";

/**
 * Versión de nuestra base local.
 *
 * Para qué sirve:
 * - Controla futuras migraciones.
 *
 * Beneficio:
 * - Si luego agregamos más tablas, podremos actualizar la BD sin borrar datos.
 */
const DATABASE_VERSION = 1;

/**
 * Instancia compartida de SQLite.
 */
let database: SQLite.SQLiteDatabase | null = null;

/**
 * Obtiene o abre la base local.
 *
 * Beneficio:
 * - Evita abrir muchas conexiones distintas.
 */
export async function getLocalDb() {
  if (!database) {
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return database;
}

/**
 * Inicializa la base local.
 *
 * Crea:
 * - sync_queue: cola de acciones pendientes por sincronizar.
 *
 * Beneficio:
 * - Nos prepara para guardar pedidos cuando la app esté offline.
 */
export async function initializeLocalDb() {
  const db = await getLocalDb();

  const currentVersionResult = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");

  const currentVersion = currentVersionResult?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_status
      ON sync_queue(status);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
