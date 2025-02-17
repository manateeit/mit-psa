'use client';

import { Suspense, useState, useEffect } from 'react';
import { TicketList } from '@/components/client-portal/tickets/TicketList';
import { Skeleton } from '@/components/ui/Skeleton';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import { getTicketStatuses } from '@/lib/actions/status-actions/statusActions';
import { getTicketCategories } from '@/lib/actions/ticketCategoryActions';
import { CategoryPicker } from '@/components/tickets/CategoryPicker';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { XCircle } from 'lucide-react';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';

export default function TicketsPage() {
  const [status, setStatus] = useState('open');
  const [statusOptions, setStatusOptions] = useState<SelectOption[]>([]);
  const [categories, setCategories] = useState<ITicketCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [statuses, categories] = await Promise.all([
          getTicketStatuses(),
          getTicketCategories()
        ]);

        setStatusOptions([
          { value: 'open', label: 'All open statuses' },
          { value: 'all', label: 'All Statuses' },
          ...statuses.map((status: { status_id: string; name: string | null; is_closed: boolean }): SelectOption => ({
            value: status.status_id!,
            label: status.name ?? "",
            className: status.is_closed ? 'bg-gray-200 text-gray-600' : undefined
          }))
        ]);

        setCategories(categories);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };

    loadFilters();
  }, []);

  const handleCategorySelect = (categoryIds: string[], excludedIds: string[]) => {
    setSelectedCategories(categoryIds);
    setExcludedCategories(excludedIds);
  };

  const handleResetFilters = () => {
    setStatus('open');
    setSelectedCategories([]);
    setExcludedCategories([]);
    setSearchQuery('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600">View and manage your support tickets</p>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <CustomSelect
            options={statusOptions}
            value={status}
            onValueChange={(value) => setStatus(value)}
            placeholder="Select Status"
          />

          <CategoryPicker
            categories={categories}
            selectedCategories={selectedCategories}
            excludedCategories={excludedCategories}
            onSelect={handleCategorySelect}
            placeholder="Filter by category"
            multiSelect={true}
            showExclude={true}
            showReset={true}
            allowEmpty={true}
            className="text-sm min-w-[200px]"
          />

          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="min-w-[200px]"
          />

          <Button
            id="reset-filters-button"
            variant="outline"
            onClick={handleResetFilters}
            className="whitespace-nowrap flex items-center gap-2 ml-auto"
          >
            <XCircle className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TicketList 
          status={status}
          selectedCategories={selectedCategories}
          excludedCategories={excludedCategories}
          searchQuery={searchQuery}
        />
      </Suspense>
    </div>
  );
}
