// src/utils/dateTimeUtils.ts

import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

// Function to convert UTC date to local timezone
export function utcToLocal(utcDate: string, timeZone: string): Date {
  const date = parseISO(utcDate);
  return toZonedTime(date, timeZone);
}

// Function to convert local date to UTC
export function localToUtc(localDate: Date, timeZone: string): Date {
  return fromZonedTime(localDate, timeZone);
}

// Function to format date for display (with time)
export function formatDateTime(date: Date, timeZone: string, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return format(toZonedTime(date, timeZone), formatString, { timeZone });
}

// Function to format date only (without time)
export function formatDateOnly(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  return format(date, formatString);
}

// Function to get user's timezone
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Example usage in a component
// import React from 'react';
// import { utcToLocal, formatDateTime, formatDateOnly, getUserTimeZone } from '../utils/dateTimeUtils';

// interface TicketProps {
//   createdAt: string; // UTC date string
//   dueDate: string;   // UTC date string
// }

// const TicketDisplay: React.FC<TicketProps> = ({ createdAt, dueDate }) => {
//   const userTimeZone = getUserTimeZone();
//   const localCreatedAt = utcToLocal(createdAt, userTimeZone);
//   const localDueDate = utcToLocal(dueDate, userTimeZone);

//   return (
//     <div>
//       <p>Created: {formatDateTime(localCreatedAt, userTimeZone)}</p>
//       <p>Due Date: {formatDateOnly(localDueDate)}</p>
//     </div>
//   );
// };

// export default TicketDisplay;