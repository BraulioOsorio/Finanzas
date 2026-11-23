import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { resolveBrandForTransaction } from '../src/domain/brands/resolveBrand';
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

const byDesc = new Map<string, { count: number; brandId: string }>();
const generic = new Map<string, number>();

for (const t of transactions) {
  const desc = (t.description || '(vacío)').trim();
  const brand = resolveBrandForTransaction(t);
  const prev = byDesc.get(desc);
  if (!prev) {
    byDesc.set(desc, { count: 1, brandId: brand.id });
  } else {
    prev.count += 1;
  }
  if (brand.id === 'generic') {
    generic.set(desc, (generic.get(desc) ?? 0) + 1);
  }
}

const brandFreq = new Map<string, number>();
for (const t of transactions) {
  const id = resolveBrandForTransaction(t).id;
  brandFreq.set(id, (brandFreq.get(id) ?? 0) + 1);
}

console.log(
  JSON.stringify(
    {
      file: csvPath,
      rows: transactions.length,
      uniqueDescriptions: byDesc.size,
      genericRows: [...generic.values()].reduce((a, b) => a + b, 0),
      topGenericDescriptions: [...generic.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25),
      topBrands: [...brandFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30),
    },
    null,
    2,
  ),
);