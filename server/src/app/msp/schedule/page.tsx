import React from 'react';
import ScheduleCalendar from '@/components/time-management/ScheduleCalendar';

export default function SchedulePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Schedule</h1>
      <ScheduleCalendar />
    </div>
  );
}