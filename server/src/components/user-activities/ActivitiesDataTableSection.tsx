import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Activity,
  ActivityFilters,
  ActivityType,
  ActivityResponse
} from '../../interfaces/activity.interfaces';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw, Filter } from 'lucide-react';
import { fetchActivities } from '../../lib/actions/activity-actions/activityServerActions';
import { ActivityDetailsDrawer } from './ActivityDetailsDrawer';
import { ActivitiesDataTable } from './ActivitiesDataTable';
import { ActivityFilters as ActivityFiltersComponent, ActivityFiltersRef } from './ActivityFilters';

interface ActivitiesDataTableSectionProps {
  title?: string;
  initialFilters?: ActivityFilters;
  id?: string;
}

export function ActivitiesDataTableSection({ 
  title = "All Activities", 
  initialFilters = {}, 
  id = "activities-data-table-section" 
}: ActivitiesDataTableSectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const filtersRef = useRef<ActivityFiltersRef>(null); // Create ref for ActivityFilters

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Use useCallback to memoize loadActivities
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      // Prepare filter
      const effectiveFilters = {
        ...filters,
        // If types array is empty, explicitly request all activity types
        types: filters.types && filters.types.length > 0
          ? filters.types
          : Object.values(ActivityType).filter(type => type !== ActivityType.WORKFLOW_TASK)
      };

      console.log(`Loading activities page ${currentPage} with filters:`, effectiveFilters);

      // Fetch activities with filters and pagination
      const result: ActivityResponse = await fetchActivities(
        effectiveFilters,
        currentPage,
        pageSize
      );

      console.log(`Loaded ${result.activities.length} activities, total: ${result.totalCount}`);
      setActivities(result.activities);
      setTotalItems(result.totalCount); // Set total items count from response
      setError(null);
    } catch (err) {
      console.error(`Error loading activities (page ${currentPage}):`, err);
      setError('Failed to load activities. Please try again later.');
      setError('Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]); // Add currentPage and pageSize to dependencies

  // useEffect to trigger loadActivities when filters or pagination changes
  useEffect(() => {
    loadActivities();
  }, [loadActivities]); // Dependency is the memoized function itself

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseDrawer = () => {
    setSelectedActivity(null);
  };

  const handleRefresh = () => {
    loadActivities();
  };

  const handleFilterChange = (newFilters: ActivityFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Card id={id}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            id={`${id}-filter-button`} 
            variant="outline" 
            size="sm"
            onClick={() => filtersRef.current?.openDialog()} // Call openDialog via ref
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button 
            id={`${id}-refresh-button`} 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Render ActivityFilters always, pass the ref */}
        {/* Visibility is handled internally by its Dialog */}
        <ActivityFiltersComponent
          ref={filtersRef}
          filters={filters}
          onChange={handleFilterChange}
        />
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading activities...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No activities found</p>
          </div>
        ) : (
          <ActivitiesDataTable
            activities={activities}
            onViewDetails={handleViewDetails}
            onActionComplete={handleRefresh}
            isLoading={loading}
            // Pass pagination props
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </CardContent>

      {/* Activity Details Drawer */}
      {selectedActivity && (
        <ActivityDetailsDrawer
          activity={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={handleCloseDrawer}
          onActionComplete={handleRefresh}
        />
      )}
    </Card>
  );
}
