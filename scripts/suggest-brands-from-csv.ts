import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { resolveCategoryIconForTransaction } from '../src/domain/categories/resolveCategoryIcon';
import { parseNekoCsv } from '../src/import/parseNekoCsv';

const csvPath = resolve(
  process.argv[2] ?? 'samples/neko_transactions_20261122_8537.csv',
);
const csv = readFileSync(csvPath, 'utf8');
const { transactions, errors } = parseNekoCsv(csv);

if (errors.length) {
  console.error(errors.slice(0, 3).join('\n'));
  process.exit(1);
}

const generic = new Map<string, number>();

for (const t of transactions) {
  const icon = resolveCategoryIconForTransaction(t);
  if (icon.id === 'cat-generic') {
    const key = `${t.categoryGroup || '?'} | ${t.category || '?'} | ${t.nekoType}`;
    generic.set(key, (generic.get(key) ?? 0) + 1);
  }
}

const brandFreq = new Map<string, number>();
for (const t of transactions) {
  const id = resolveCategoryIconForTransaction(t).id;
  brandFreq.set(id, (brandFreq.get(id) ?? 0) + 1);
}

console.log(
  JSON.stringify(
    {
      file: csvPath,
      rows: transactions.length,
      genericRows: [...generic.values()].reduce((a, b) => a + b, 0),
      uncategorizedCategoryKeys: [...generic.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25),
      topBrands: [...brandFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
    },
    null,
    2,
  ),
);