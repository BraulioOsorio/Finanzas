import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parseNekoCsv } from '../src/import/parseNekoCsv';

const csvPath = resolve(
  process.argv[2] ?? 'samples/neko_transactions_20261122_8537.csv',
);
const csv = readFileSync(csvPath, 'utf8');
const { transactions, errors } = parseNekoCsv(csv);

const byKind = { income: 0, expense: 0, transfer: 0 };
for (const t of transactions) {
  byKind[t.kind] += 1;
}

console.log(JSON.stringify({ file: csvPath, total: transactions.length, byKind, errors: errors.length }, null, 2));
if (errors.length) {
  console.error(errors.slice(0, 5).join('\n'));
  process.exit(1);
}