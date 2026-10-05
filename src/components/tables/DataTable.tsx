import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { DataTablePagination } from './DataTablePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/cn';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyState?: { title: string; description?: string; action?: { label: string; onClick: () => void } };
  onRowClick?: (row: T) => void;
  pageSize?: number;
  toolbarActions?: ReactNode;
  initialSearch?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  isLoading,
  emptyState,
  onRowClick,
  pageSize = 10,
  toolbarActions,
  initialSearch = '',
  searchValue,
  onSearchChange,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState(initialSearch);
  const searchInput = searchValue !== undefined ? searchValue : internalSearch;
  const globalFilter = useDebounce(searchInput, 250);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleSearchChange = (value: string) => {
    if (searchValue === undefined) {
      setInternalSearch(value);
    }
    onSearchChange?.(value);
  };

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const rowData = row.original as Record<string, unknown>;
      return Object.values(rowData).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    },
  });

  return (
    <div className="rounded-xl border border-secondary-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-secondary-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          containerClassName="w-full sm:max-w-xs"
        />
        {toolbarActions && <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>}
      </div>

      {isLoading ? (
        <div className="p-4">
          <Skeleton variant="table-row" count={5} />
        </div>
      ) : data.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title={emptyState?.title ?? 'No records found'}
            description={emptyState?.description}
            action={emptyState?.action}
          />
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto" role="region" aria-label="Table" tabIndex={0}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-secondary-100 bg-secondary-50/60">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDir = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-secondary-500',
                            canSort && 'cursor-pointer select-none hover:text-secondary-700',
                          )}
                        >
                          {header.isPlaceholder ? null : (
                            <span className="inline-flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort &&
                                (sortDir === 'asc' ? (
                                  <ArrowUp className="size-3.5" />
                                ) : sortDir === 'desc' ? (
                                  <ArrowDown className="size-3.5" />
                                ) : (
                                  <ArrowUpDown className="size-3.5 text-secondary-300" />
                                ))}
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'border-b border-secondary-50 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-secondary-50/70',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-secondary-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
