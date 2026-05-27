import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export function useTableSort<T, K extends string = string>(
  items: T[],
  initialConfig?: { column: K | null; direction: SortDirection },
  getSortValue?: (item: T, column: K) => any
) {
  const [sortColumn, setSortColumn] = useState<K | null>(initialConfig?.column ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialConfig?.direction ?? 'asc');

  const handleSort = (column: K) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortColumn) return items;

    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (getSortValue) {
        aValue = getSortValue(a, sortColumn);
        bValue = getSortValue(b, sortColumn);
      } else {
        aValue = (a as any)[sortColumn];
        bValue = (b as any)[sortColumn];
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortColumn, sortDirection, getSortValue]);

  return { sortColumn, sortDirection, handleSort, sortedItems };
}
