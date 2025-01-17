'use client'
import { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { SwitchWithLabel } from '../ui/SwitchWithLabel';
import { IWorkItem, IExtendedWorkItem, WorkItemType } from '../../interfaces/workItem.interfaces';
import { searchWorkItems } from '../../lib/actions/workItemActions';
import { Button } from '../ui/Button';
import UserPicker from '../ui/UserPicker';
import { CompanyPicker } from '../companies/CompanyPicker';
import { DatePicker } from '../ui/DatePicker';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { getAllUsers, getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { ICompany } from '@/interfaces/company.interfaces';

interface WorkItemPickerProps {
  onSelect: (workItem: IWorkItem | null) => void;
  existingWorkItems: IWorkItem[];
  initialWorkItemId?: string | null;
  initialWorkItemType?: WorkItemType;
}

interface WorkItemWithStatus extends Omit<IExtendedWorkItem, "tenant"> {
  status: string;
}

export function WorkItemPicker({ onSelect, existingWorkItems }: WorkItemPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [workItems, setWorkItems] = useState<WorkItemWithStatus[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [users, setUsers] = useState<IUserWithRoles[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('active');
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'company' | 'individual'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedUsers, fetchedCompanies] = await Promise.all([
          getAllUsers(),
          getAllCompanies()
        ]);
        setUsers(fetchedUsers);
        setCompanies(fetchedCompanies);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Handle "Assigned to me" toggle
  const handleAssignedToMeChange = async (checked: boolean) => {
    setAssignedToMe(checked);
    if (checked) {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setAssignedTo(currentUser.user_id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    } else {
      setAssignedTo('');
    }
    setCurrentPage(1);
    loadWorkItems(searchTerm, 1);
  };
  const pageSize = 20;

  const loadWorkItems = useCallback(async (term: string, page: number) => {
    setIsSearching(true);
    try {
      const result = await searchWorkItems({ 
        searchTerm: term,
        page,
        pageSize,
        sortBy: 'name',
        sortOrder: 'asc',
        includeInactive,
        assignedTo: assignedTo || undefined,
        assignedToMe,
        companyId: companyId || undefined,
        dateRange: startDate || endDate ? {
          start: startDate,
          end: endDate
        } : undefined
      });
      
      // Filter out items that are already on the timesheet
      const existingIds = new Set(existingWorkItems.map((item): string => item.work_item_id));
      const filteredItems = result.items.filter(item => !existingIds.has(item.work_item_id));
      
      const itemsWithStatus = filteredItems.map((item): WorkItemWithStatus => ({ 
        work_item_id: item.work_item_id,
        type: item.type,
        name: item.name,
        description: item.description,
        is_billable: item.is_billable,
        ticket_number: item.ticket_number,
        title: item.title,
        project_name: item.project_name,
        phase_name: item.phase_name,
        task_name: item.task_name,
        status: 'Active'
      }));

      setWorkItems(itemsWithStatus);
      setTotal(result.total);
      setHasMore(result.total > page * pageSize);
    } catch (error) {
      console.error('Error loading work items:', error);
      // Show error state in the list
      setWorkItems([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  }, [existingWorkItems, includeInactive, assignedTo, assignedToMe, companyId, startDate, endDate]);

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

  const handlePageChange = (newPage: number) => {
    if (!isSearching && newPage >= 1 && newPage <= Math.ceil(total / pageSize)) {
      setCurrentPage(newPage);
      loadWorkItems(searchTerm, newPage);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const renderWorkItemContent = (item: WorkItemWithStatus) => {
    if (item.type === 'ticket') {
      return (
        <>
          <div className="font-medium text-[rgb(var(--color-text-900))]">
            {item.ticket_number} - {item.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-primary-100))] text-[rgb(var(--color-primary-900))]">
              Ticket
            </span>
            {item.is_billable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-accent-100))] text-[rgb(var(--color-accent-900))]">
                Billable
              </span>
            )}
          </div>
        </>
      );
    } else if (item.type === 'project_task') {
      return (
        <>
          <div className="font-medium text-[rgb(var(--color-text-900))]">
            {item.project_name}
          </div>
          <div className="text-sm text-[rgb(var(--color-text-600))]">
            {item.phase_name} → {item.task_name}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-primary-100))] text-[rgb(var(--color-primary-900))]">
              Project Task
            </span>
            {item.is_billable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-accent-100))] text-[rgb(var(--color-accent-900))]">
                Billable
              </span>
            )}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(80vh-8rem)]">
      <div className="flex-none bg-white dark:bg-[rgb(var(--color-border-50))] pb-4">
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => onSelect(null)}
            variant="outline"
            className="text-sm"
            id="create-adhoc-entry-btn"
          >
            Create Ad-hoc Entry
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
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
          <SwitchWithLabel
            label="Include inactive"
            checked={includeInactive}
            onCheckedChange={(checked) => {
              setIncludeInactive(checked);
              setCurrentPage(1);
              loadWorkItems(searchTerm, 1);
            }}
            className="text-sm text-[rgb(var(--color-text-600))]"
          />
        </div>
        <div className="mt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <UserPicker
                label="Assigned to"
                value={assignedTo}
                onValueChange={(value) => {
                  setAssignedTo(value);
                  setCurrentPage(1);
                  loadWorkItems(searchTerm, 1);
                }}
                disabled={assignedToMe}
                users={users}
              />
              <SwitchWithLabel
                label="Assigned to me"
                checked={assignedToMe}
              onCheckedChange={handleAssignedToMeChange}
                className="text-sm text-[rgb(var(--color-text-600))]"
              />
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <CompanyPicker
                id="work-item-company-picker"
                selectedCompanyId={companyId}
                onSelect={(value: string) => {
                  setCompanyId(value);
                  setCurrentPage(1);
                  loadWorkItems(searchTerm, 1);
                }}
                filterState={filterState}
                onFilterStateChange={setFilterState}
                clientTypeFilter={clientTypeFilter}
                onClientTypeFilterChange={setClientTypeFilter}
                companies={companies}
                fitContent
              />
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setCurrentPage(1);
                    loadWorkItems(searchTerm, 1);
                  }}
                  placeholder="Start date"
                />
                <DatePicker
                  label="End date"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setCurrentPage(1);
                    loadWorkItems(searchTerm, 1);
                  }}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="bg-white dark:bg-[rgb(var(--color-border-50))] rounded-md border border-[rgb(var(--color-border-200))]">
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
                        {renderWorkItemContent(item)}
                      </div>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className="p-2 border-t border-[rgb(var(--color-border-200))] flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-3 py-1 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentPage === 1 || isSearching}
                      id="previous-page-btn"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-[rgb(var(--color-text-600))]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-3 py-1 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-text-900))] hover:bg-[rgb(var(--color-border-100))] rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!hasMore || isSearching}
                      id="next-page-btn"
                    >
                      Next
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
