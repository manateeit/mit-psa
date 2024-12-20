import React, { useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  Row,
} from '@tanstack/react-table';
import { ColumnDefinition, DataTableProps } from '@/interfaces/dataTable.interfaces';

// Helper function to get nested property value
const getNestedValue = (obj: unknown, path: string | string[]): unknown => {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  
  const keys = Array.isArray(path) ? path : path.split('.');
  return keys.reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

export const DataTable = <T extends object>(props: DataTableProps<T>): React.ReactElement => {
  const {
    data,
    columns,
    pagination = true,
    onRowClick,
    currentPage = 1,
    onPageChange,
    pageSize = 10,
    totalItems,
    editableConfig
  } = props;

  // Generate a unique context for this table instance
  const tableContext = useMemo(() => Math.random().toString(36).substring(7), []);

  // Create stable column definitions
  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col): ColumnDef<T> => ({
        id: Array.isArray(col.dataIndex) ? col.dataIndex.join('_') : col.dataIndex,
        accessorFn: (row) => getNestedValue(row, col.dataIndex),
        header: () => col.title,
        cell: (info) => col.render ? col.render(info.getValue(), info.row.original, info.row.index) : info.getValue(),
      })),
    [columns]
  );

  // Keep internal pagination state synced with props
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: currentPage - 1
    }));
  }, [currentPage]);

  const [{ pageIndex, pageSize: currentPageSize }, setPagination] = React.useState({
    pageIndex: currentPage - 1,
    pageSize,
  });

  // Calculate total pages based on totalItems if provided, otherwise use data length
  const total = totalItems ?? data.length;
  const totalPages = Math.ceil(total / pageSize);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex,
        pageSize: currentPageSize,
      },
    },
    onPaginationChange: setPagination,
    manualPagination: totalItems !== undefined,
    meta: {
      editableConfig: props.editableConfig,
    },
  });

  const handleRowClick = (row: Row<T>) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  // Notify parent component of page changes
  React.useEffect(() => {
    if (onPageChange) {
      onPageChange(pageIndex + 1);
    }
  }, [pageIndex, onPageChange]);

  const handlePreviousPage = () => {
    table.previousPage();
  };

  const handleNextPage = () => {
    table.nextPage();
  };

  return (
    <div className="datatable-container overflow-hidden bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={`${tableContext}_headergroup_${headerGroup.id}`}>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.columnDef.id || header.id;
                  return (
                    <th 
                      key={`${tableContext}_header_${columnId}`}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--color-text-700))] tracking-wider cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span className="text-gray-400">
                          {{
                            asc: ' ↑',
                            desc: ' ↓',
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getPaginationRowModel().rows.map((row) => {
              // Use the id property if it exists in the data, otherwise use row.id
              const rowId = ('id' in row.original) ? (row.original as { id: string }).id : row.id;
              return (
                <tr
                  key={`${tableContext}_row_${rowId}`}
                  onClick={() => handleRowClick(row)}
                  className={`
                    ${row.index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    hover:bg-blue-50 transition-colors cursor-pointer
                  `}
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnId = cell.column.columnDef.id || cell.column.id;
                    return (
                      <td 
                        key={`${tableContext}_cell_${rowId}_${columnId}`}
                        className="px-6 py-4 whitespace-nowrap text-[14px] text-[rgb(var(--color-text-700))]"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousPage}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-[rgb(var(--color-text-700))] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-[rgb(var(--color-text-700))]">
              Page {pageIndex + 1} of{' '}
              {totalPages} ({total} total records)
            </span>
            <button
              onClick={handleNextPage}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-[rgb(var(--color-text-700))] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
