'use client';

import React, { useMemo } from 'react';
import { DataTable } from 'server/src/components/ui/DataTable';
import { ColumnDefinition } from 'server/src/interfaces/dataTable.interfaces';
import type { InvoiceViewModel } from 'server/src/interfaces/invoice.interfaces';
import { Skeleton } from 'server/src/components/ui/Skeleton';
import { Button } from 'server/src/components/ui/Button';
import { MoreVertical, Download, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'server/src/components/ui/DropdownMenu';

interface InvoicesTabProps {
  invoices: InvoiceViewModel[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onInvoiceClick: (invoice: InvoiceViewModel) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | { toString(): string } | undefined | null) => string;
}

const InvoicesTab: React.FC<InvoicesTabProps> = React.memo(({
  invoices,
  currentPage,
  onPageChange,
  onInvoiceClick,
  formatCurrency,
  formatDate
}) => {
  // Memoize the columns to prevent unnecessary re-creation
  const invoiceColumns: ColumnDefinition<InvoiceViewModel>[] = useMemo(() => [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number'
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      render: (value: string) => formatDate(value)
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      render: (value: number) => formatCurrency(value)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      title: 'Actions',
      dataIndex: 'invoice_id',
      render: (value: string, record: InvoiceViewModel, index: number) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={`invoice-${record.invoice_number}-actions-menu`}
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem id={`view-invoice-${record.invoice_number}-menu-item`} onClick={() => onInvoiceClick(record)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem id={`download-invoice-${record.invoice_number}-menu-item`}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], [formatDate, formatCurrency, onInvoiceClick]);

  // Loading state with skeleton
  if (!invoices || invoices.length === 0) {
    return (
      <div id="invoices-loading" className="py-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="invoices-content" className="py-4">
      <div id="invoices-table-container">
        <DataTable
          data={invoices}
          columns={invoiceColumns}
          pagination={true}
          currentPage={currentPage}
          onPageChange={onPageChange}
          pageSize={10}
          onRowClick={onInvoiceClick}
        />
        {invoices.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Add display name for debugging
InvoicesTab.displayName = 'InvoicesTab';

export default InvoicesTab;