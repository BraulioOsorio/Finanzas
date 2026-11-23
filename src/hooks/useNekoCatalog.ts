import { useMemo } from 'react';

import {
  UNCATEGORIZED_GROUP,
  allCategoryGroups,
  categoriesForGroup,
} from '../domain/nekoCatalog';
import { useTransactions } from '../context/TransactionsContext';

export function useNekoCatalog() {
  const { categoryTree } = useTransactions();
  return useMemo(
    () => ({
      categoryTree,
      UNCATEGORIZED_GROUP,
      categoriesForGroup: (group: string) => categoriesForGroup(group, categoryTree),
      allCategoryGroups: () => allCategoryGroups(categoryTree),
    }),
    [categoryTree],
  );
}