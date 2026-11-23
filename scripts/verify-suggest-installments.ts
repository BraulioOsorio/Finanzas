import { readFileSync } from 'node:fs';

import { buildSeedAccounts } from '../src/domain/accounts/seedAccounts';
import { parseNekoCsv } from '../src/import/parseNekoCsv';
import { suggestInstallmentsFromTransactions } from '../src/domain/suggestInstallmentsFromTransactions';

const path = process.argv[2] ?? 'samples/neko_transactions_20261122_8537.csv';
const csv = readFileSync(path, 'utf8');
const { transactions } = parseNekoCsv(csv);
const accounts = buildSeedAccounts();
const suggestions = suggestInstallmentsFromTransactions(transactions, accounts);

console.log(`Compras a meses sugeridas: ${suggestions.length}`);
for (const s of suggestions.slice(0, 8)) {
  console.log(
    `- ${s.title} · ${s.account} · ${s.installmentCount} cuotas · ${s.reason}`,
  );
}