'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { formatDistanceToNow } from 'date-fns';
import { getClientTickets } from '@/lib/actions/client-portal-actions/client-tickets';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { ITicketListItem } from '@/interfaces/ticket.interfaces';
import { TicketDetails } from './TicketDetails';

interface TicketListProps {
  status: string;
  selectedCategories?: string[];
  excludedCategories?: string[];
  searchQuery?: string;
}

export function TicketList({ 
  status, 
  selectedCategories = [], 
  excludedCategories = [], 
  searchQuery = '' 
}: TicketListProps) {
  const [tickets, setTickets] = useState<ITicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('entered_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      try {
        const result = await getClientTickets(status);
        
        // Apply client-side filtering
        let filteredTickets = [...result];

        // Filter by categories
        if (selectedCategories.length > 0) {
          filteredTickets = filteredTickets.filter(ticket => {
            if (selectedCategories.includes('no-category')) {
              return !ticket.category_id && !ticket.subcategory_id;
            }
            return selectedCategories.includes(ticket.category_id || '') || 
                   selectedCategories.includes(ticket.subcategory_id || '');
          });
        }

        // Filter by excluded categories
        if (excludedCategories.length > 0) {
          filteredTickets = filteredTickets.filter(ticket => {
            if (excludedCategories.includes('no-category')) {
              return ticket.category_id || ticket.subcategory_id;
            }
            return !excludedCategories.includes(ticket.category_id || '') && 
                   !excludedCategories.includes(ticket.subcategory_id || '');
          });
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredTickets = filteredTickets.filter(ticket => 
            ticket.title?.toLowerCase().includes(query) ||
            ticket.ticket_number?.toLowerCase().includes(query) ||
            ticket.status_name?.toLowerCase().includes(query) ||
            ticket.priority_name?.toLowerCase().includes(query)
          );
        }

        // Apply sorting
        const sortedTickets = [...filteredTickets].sort((a, b) => {
          const aValue = a[sortField as keyof ITicketListItem];
          const bValue = b[sortField as keyof ITicketListItem];

          if (!aValue && !bValue) return 0;
          if (!aValue) return 1;
          if (!bValue) return -1;

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          // Handle date fields
          if (sortField === 'entered_at' || sortField === 'updated_at') {
            const aDate = new Date(aValue as string);
            const bDate = new Date(bValue as string);
            return sortDirection === 'asc' 
              ? aDate.getTime() - bDate.getTime()
              : bDate.getTime() - aDate.getTime();
          }

          return 0;
        });

        setTickets(sortedTickets);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      }
      setLoading(false);
    };

    loadTickets();
  }, [status, selectedCategories, excludedCategories, searchQuery]);

  const handleSort = (field: string) => {
    setSortDirection(current => 
      sortField === field 
        ? current === 'asc' ? 'desc' : 'asc'
        : 'asc'
    );
    setSortField(field);
  };

  const columns: ColumnDefinition<ITicketListItem>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      render: (value: string) => (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority_name',
      render: (value: string) => (
        <div className="capitalize">{value}</div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'entered_at',
      render: (value: string | null) => (
        <div className="text-sm text-gray-500">
          {value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : '-'}
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      render: (value: string | null) => (
        <div className="text-sm text-gray-500">
          {value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : '-'}
        </div>
      ),
    },
  ];

  const handleRowClick = (ticket: ITicketListItem) => {
    if (ticket.ticket_id) {
      setSelectedTicketId(ticket.ticket_id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <DataTable
        data={tickets}
        columns={columns}
        pagination={true}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        pageSize={10}
        onRowClick={handleRowClick}
      />

      {selectedTicketId && (
        <TicketDetails
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}
