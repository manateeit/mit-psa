'use client'
import { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { IWorkItem } from '@/interfaces/workItem.interfaces';
import { searchWorkItems } from '@/lib/actions/workItemActions';

interface WorkItemPickerProps {
  onSelect: (workItem: IWorkItem) => void;
  existingWorkItems: IWorkItem[];
  initialWorkItemId?: string;
  initialWorkItemType?: 'ticket' | 'project_task' | 'non_billable_category';
}

interface WorkItemWithStatus extends IWorkItem {
  status: string;
}

export function WorkItemPicker({ onSelect, existingWorkItems }: WorkItemPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [workItems, setWorkItems] = useState<WorkItemWithStatus[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const loadWorkItems = useCallback(async (term: string, page: number) => {
    setIsSearching(true);
    try {
      const result = await searchWorkItems({ 
        searchTerm: term,
        page,
        pageSize,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      // Filter out items that are already on the timesheet
      const existingIds = new Set(existingWorkItems.map((item): string => item.work_item_id));
      const filteredItems = result.items.filter(item => !existingIds.has(item.work_item_id));
      
      const itemsWithStatus = filteredItems.map((item: IWorkItem): WorkItemWithStatus => ({ 
        ...item, 
        status: 'Active' 
      }));

      if (page === 1) {
        setWorkItems(itemsWithStatus);
      } else {
        setWorkItems(prev => [...prev, ...itemsWithStatus]);
      }
      
      setTotal(result.total);
      setHasMore(result.total > page * pageSize);
    } catch (error) {
      console.error('Error loading work items:', error);
    } finally {
      setIsSearching(false);
    }
  }, [existingWorkItems]);

  // Load initial items when component mounts
  useEffect(() => {
    loadWorkItems('', 1);
  }, [loadWorkItems]);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setCurrentPage(1);
      loadWorkItems(term, 1);
    }, 200),
    [loadWorkItems]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleLoadMore = () => {
    if (!isSearching && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadWorkItems(searchTerm, nextPage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search work items..."
          className="pl-8 bg-white dark:bg-[rgb(var(--color-border-50))] border-[rgb(var(--color-border-200))]"
        />
        <svg
          className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgb(var(--color-text-400))]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(var(--color-primary-500))]"></div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[rgb(var(--color-border-50))] rounded-md border border-[rgb(var(--color-border-200))] overflow-hidden">
        {workItems.length > 0 ? (
          <div>
            <ul className="divide-y divide-[rgb(var(--color-border-200))]">
              {workItems.map((item): JSX.Element => (
                <li
                  key={item.work_item_id}
                  className="hover:bg-[rgb(var(--color-border-100))] cursor-pointer transition-colors duration-150"
                  onClick={() => onSelect(item)}
                >
                  <div className="px-4 py-3">
                    <div className="font-medium text-[rgb(var(--color-text-900))]">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-primary-100))] text-[rgb(var(--color-primary-900))]">
                        {item.type === 'ticket' ? 'Ticket' : 'Project Task'}
                      </span>
                      {item.is_billable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-accent-100))] text-[rgb(var(--color-accent-900))]">
                          Billable
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-sm text-[rgb(var(--color-text-600))] mt-1 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="p-2 border-t border-[rgb(var(--color-border-200))]">
                <button
                  onClick={handleLoadMore}
                  className="w-full px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] rounded-md transition-colors duration-150"
                  disabled={isSearching}
                >
                  {isSearching ? 'Loading...' : `Load More (${workItems.length} of ${total})`}
                </button>
              </div>
            )}
          </div>
        ) : searchTerm && !isSearching ? (
          <div className="p-4 text-center text-[rgb(var(--color-text-500))]">
            No work items found. Try adjusting your search terms.
          </div>
        ) : !isSearching ? (
          <div className="p-4 text-center text-[rgb(var(--color-text-500))]">
            No available work items.
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<F>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as F;
}
