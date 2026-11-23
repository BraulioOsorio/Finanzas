import { resolveCategoryIconForScheduled, resolveCategoryIconForTransaction } from '../categories/resolveCategoryIcon';
import {
  resolveBrandForAccount,
  resolveBrandForScheduled,
  resolveBrandForTransaction,
} from '../brands/resolveBrand';
import type { BrandDef } from '../brands/types';
import type { ScheduledPayment, Transaction, IconDisplayMode } from '../../types';

export function resolveDisplayIconForTransaction(
  t: Transaction,
  mode: IconDisplayMode,
): BrandDef {
  switch (mode) {
    case 'category':
      return resolveCategoryIconForTransaction(t);
    case 'description':
      return resolveBrandForTransaction(t);
    case 'account':
      return resolveBrandForAccount(t.account);
    default:
      return resolveCategoryIconForTransaction(t);
  }
}

export function resolveDisplayIconForScheduled(
  p: ScheduledPayment,
  mode: IconDisplayMode,
): BrandDef {
  switch (mode) {
    case 'category':
      return resolveCategoryIconForScheduled(p);
    case 'description':
      return resolveBrandForScheduled(p);
    case 'account':
      return resolveBrandForAccount(p.account);
    default:
      return resolveCategoryIconForScheduled(p);
  }
}