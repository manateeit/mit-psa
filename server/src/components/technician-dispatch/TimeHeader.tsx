import React from 'react';
import { isWorkingHour } from './utils';

interface TimeHeaderProps {
  timeSlots: string[];
}

const TimeHeader: React.FC<TimeHeaderProps> = ({ timeSlots }) => {
  return (
    <div className="grid grid-cols-24 gap-0 mb-4">
      {timeSlots.filter((_, index) => index % 4 === 0).map((slot: string): JSX.Element => {
        const hour = parseInt(slot);
        const isWorking = isWorkingHour(hour);
        return (
          <div
            key={slot}
            className={`text-center text-xs font-semibold ${isWorking ? 'time-header-working' : 'time-header-non-working'}`}
          >
            {slot}
          </div>
        );
      })}
    </div>
  );
};

export default TimeHeader;
