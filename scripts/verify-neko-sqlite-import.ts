/**
 * Verifica importación desde «Neko - My Data» (SQLite).
 * Uso: npx tsx scripts/verify-neko-sqlite-import.ts [ruta-al-archivo]
 */
import Database from 'better-sqlite3';

import { parseNekoSqlite, type NekoSqliteDriver } from '../src/import/parseNekoSqlite';

const path = process.argv[2] ?? '/tmp/neko-data/Neko-My-Data';

const db = new Database(path, { readonly: true });

const driver: NekoSqliteDriver = {
  all: async (sql, params) => db.prepare(sql).all(...(params ?? [])) as Record<string, unknown>[],
};

async function main() {
  const bundle = await parseNekoSqlite(driver);
  db.close();
  console.log('Archivo:', path);
  console.log('Stats:', bundle.stats);
  if (bundle.errors.length) {
    console.log('Errores (primeros 5):', bundle.errors.slice(0, 5));
  }
  const sample = bundle.transactions.slice(0, 3).map((t) => ({
    date: t.postedDate,
    type: t.nekoType,
    desc: t.description,
    signed: t.signedAmount,
    account: t.account,
  }));
  console.log('Muestra:', sample);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});