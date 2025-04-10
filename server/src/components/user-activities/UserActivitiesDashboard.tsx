import React, { useState, useEffect, useMemo } from 'react';
import ViewSwitcher, { ViewSwitcherOption } from 'server/src/components/ui/ViewSwitcher';
import { ScheduleSection } from './ScheduleSection';
import { TicketsSection } from './TicketsSection';
import { ProjectsSection } from './ProjectsSection';
import { WorkflowTasksSection } from './WorkflowTasksSection';
import { ActivitiesDataTableSection } from './ActivitiesDataTableSection';
import { Button } from '../ui/Button';
import { LayoutGrid, List } from 'lucide-react';
import { ActivityFilters as ActivityFiltersType, ActivityType } from '../../interfaces/activity.interfaces';
import { CustomTabs } from '../ui/CustomTabs';
import { DrawerProvider } from '../../context/DrawerContext';
import { ActivityDrawerProvider } from './ActivityDrawerProvider';
import { getCurrentUser, getUserPreference, setUserPreference } from '../../lib/actions/user-actions/userActions';

export function UserActivitiesDashboard() {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tableInitialFilters, setTableInitialFilters] = useState<ActivityFiltersType | null>(null); // State for specific filters

  // Generic handler for "View All" clicks
  const handleViewAll = (types: ActivityType[]) => {
    const filters: ActivityFiltersType = { types, isClosed: false };
    setTableInitialFilters(filters);
    setViewMode('table');
    // Optionally save preference if desired when clicking "View All"
    // if (currentUser?.user_id) {
    //   setUserPreference(currentUser.user_id, 'activitiesDashboardViewMode', 'table').catch(console.error);
    // }
  };

  // Specific handlers calling the generic one
  const handleViewAllSchedule = () => handleViewAll([ActivityType.SCHEDULE]); // Corrected Enum Member
  const handleViewAllProjects = () => handleViewAll([ActivityType.PROJECT_TASK]);
  const handleViewAllTickets = () => handleViewAll([ActivityType.TICKET]);
  const handleViewAllWorkflowTasks = () => handleViewAll([ActivityType.WORKFLOW_TASK]);

  // Load user preference when component mounts
  useEffect(() => {
    const loadUserPreference = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        if (user?.user_id) {
          const savedViewMode = await getUserPreference(user.user_id, 'activitiesDashboardViewMode');
          if (savedViewMode === 'cards' || savedViewMode === 'table') {
            setViewMode(savedViewMode);
          }
        }
      } catch (error) {
        console.error('Error loading user preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserPreference();
  }, []);

  // Determine the filters to apply to the table
  const currentTableFilters: ActivityFiltersType = tableInitialFilters || {
    types: [], // Default: Load all activity types
    isClosed: false // Default: Only show open activities
  };

  // Table view content - Defined before use and memoized to prevent unnecessary re-renders
  const tableViewContent = useMemo(() => (
    <ActivitiesDataTableSection
      title={tableInitialFilters ? `Filtered Activities` : "All Activities"} // Dynamic title
      initialFilters={currentTableFilters}
      id="all-activities-table-section"
    />
  ), [currentTableFilters, tableInitialFilters]
  );

  // Card view content - Defined before use and memoized to prevent unnecessary re-renders
  const cardViewContent = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Schedule Section */}
      <ScheduleSection
        limit={5}
        onViewAll={handleViewAllSchedule}
      />

      {/* Tickets Section */}
      <TicketsSection
        limit={5}
        onViewAll={handleViewAllTickets}
      />

      {/* Projects Section */}
      <ProjectsSection
        limit={5}
        onViewAll={handleViewAllProjects}
      />

      {/* Workflow Tasks Section */}
      <WorkflowTasksSection
        limit={5}
        onViewAll={handleViewAllWorkflowTasks}
      />
    </div>
  ), [handleViewAllSchedule, handleViewAllTickets, handleViewAllProjects, handleViewAllWorkflowTasks]
  );

  // Define view mode type
  type UserActivitiesViewMode = 'cards' | 'table';

  // Define options for the ViewSwitcher with explicit type
  const viewOptions: ViewSwitcherOption<UserActivitiesViewMode>[] = [
    { value: 'cards', label: 'Cards', icon: LayoutGrid },
    { value: 'table', label: 'Table', icon: List },
  ];

  // Handler for view change
  const handleViewChange = async (newView: UserActivitiesViewMode) => {
    setViewMode(newView);
    if (newView === 'table') {
      setTableInitialFilters(null); // Reset specific filters when switching to table view
    }
    // Save preference
    if (currentUser?.user_id) {
      try {
        await setUserPreference(currentUser.user_id, 'activitiesDashboardViewMode', newView);
      } catch (error) {
        console.error('Error saving view mode preference:', error);
      }
    }
  };

  return (
    <DrawerProvider>
      <ActivityDrawerProvider>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">User Activities</h1>
            <div className="flex items-center gap-4">
              <ViewSwitcher
                options={viewOptions}
                currentView={viewMode}
                onChange={handleViewChange}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">Loading user preferences...</p>
            </div>
          ) : (
            viewMode === 'cards' ? cardViewContent : tableViewContent
          )}
        </div>
      </ActivityDrawerProvider>
    </DrawerProvider>
  );
}