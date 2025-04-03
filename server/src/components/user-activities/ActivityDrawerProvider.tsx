'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Activity, ActivityType } from '../../interfaces/activity.interfaces';
import { useDrawer } from '../../context/DrawerContext';
import { ActivityDetailViewerDrawer } from './ActivityDetailViewerDrawer';

/**
 * Context for managing activity drawer state
 */
interface ActivityDrawerContextType {
  openActivityDrawer: (activity: Activity) => void;
}

const ActivityDrawerContext = createContext<ActivityDrawerContextType | undefined>(undefined);

/**
 * Provider component for managing activity drawer state
 * This component provides a method to open the drawer with a specific activity
 * and renders the ActivityDetailViewerDrawer when an activity is selected
 */
export function ActivityDrawerProvider({ children }: { children: ReactNode }) {
  const { openDrawer, closeDrawer } = useDrawer();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const openActivityDrawer = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    openDrawer(
      <ActivityDetailViewerDrawer
        activityType={activity.type}
        activityId={activity.id}
        onClose={() => {
          setSelectedActivity(null);
          closeDrawer();
        }}
        onActionComplete={() => {
          // Handle action completion (e.g., refresh data)
          setSelectedActivity(null);
          closeDrawer();
        }}
      />
    );
  }, [openDrawer, closeDrawer]);
  
  return (
    <ActivityDrawerContext.Provider value={{ openActivityDrawer }}>
      {children}
    </ActivityDrawerContext.Provider>
  );
}

/**
 * Hook for accessing the activity drawer context
 * This hook must be used within an ActivityDrawerProvider
 */
export const useActivityDrawer = () => {
  const context = useContext(ActivityDrawerContext);
  if (!context) {
    throw new Error('useActivityDrawer must be used within an ActivityDrawerProvider');
  }
  return context;
};