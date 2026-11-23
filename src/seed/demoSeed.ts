import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

import { applyImport, parseNekoCsv } from '../import/parseNekoCsv';
import type { Transaction } from '../types';

// Empaquetado en assets/neko_sample.csv (copia de samples/).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bundledSample = require('../../assets/neko_sample.csv');

/**
 * Carga el CSV Neko de demostración (solo si el dispositivo no tiene movimientos).
 * Puedes borrar datos en Importar / reinstalar cuando quieras datos reales.
 */
export async function loadDemoTransactionsFromBundledCsv(): Promise<Transaction[]> {
  try {
    const asset = Asset.fromModule(bundledSample);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) {
      return [];
    }
    const file = new File(uri);
    const csv = await file.text();
    const { transactions: incoming, errors } = parseNekoCsv(csv);
    if (!incoming.length) {
      if (errors.length) {
        console.warn('[demo-seed] parse errors:', errors.slice(0, 3));
      }
      return [];
    }
    const { next } = applyImport([], incoming, 'replace');
    return next;
  } catch (e) {
    console.warn('[demo-seed] failed', e);
    return [];
  }
}