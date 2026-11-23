import * as SQLite from 'expo-sqlite';

import { assertSqliteBytes, readBytesFromPickedUri } from '../utils/pickedDocument';
import { parseNekoSqlite, type NekoSqliteImportBundle } from './parseNekoSqlite';

const PREFLIGHT_SQL = `
  SELECT name FROM sqlite_master
  WHERE type='table' AND name='tbl_transaction_entry'
  LIMIT 1
`;

/** Lee el backup NEKO en memoria (evita rutas distintas document/SQLite vs files/SQLite en Android). */
export async function parseNekoSqliteFromUri(pickedUri: string): Promise<NekoSqliteImportBundle> {
  const bytes = await readBytesFromPickedUri(pickedUri);
  assertSqliteBytes(bytes);

  const db = await SQLite.deserializeDatabaseAsync(bytes);

  const probe = await db.getAllAsync<{ name: string }>(PREFLIGHT_SQL);
  if (!probe.length) {
    await db.closeAsync().catch(() => undefined);
    throw new Error(
      'Este SQLite no es un backup NEKO (falta tbl_transaction_entry). Comprueba que sea «Neko - My Data».',
    );
  }

  const bundle = await parseNekoSqlite({
    all: async <T extends Record<string, unknown>>(sql: string) =>
      (await db.getAllAsync<T>(sql)) as T[],
  });

  try {
    await db.closeAsync();
  } catch {
    /* ignore */
  }

  return bundle;
}