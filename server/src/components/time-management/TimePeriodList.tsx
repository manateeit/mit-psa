import React from 'react';
import { ITimePeriod, ITimePeriodWithStatus, TimeSheetStatus } from '@/interfaces/timeEntry.interfaces';
import { Table, Button } from '@radix-ui/themes';
import { parseISO } from 'date-fns';

interface TimePeriodListProps {
  timePeriods: ITimePeriodWithStatus[];
  onSelectTimePeriod: (timePeriod: ITimePeriodWithStatus) => void;
}

const getStatusDisplay = (status: TimeSheetStatus): { text: string; color: string } => {
  switch (status) {
    case 'DRAFT':
      return { text: 'In Progress', color: 'blue' };
    case 'SUBMITTED':
      return { text: 'Submitted', color: 'yellow' };
    case 'APPROVED':
      return { text: 'Approved', color: 'green' };
    case 'CHANGES_REQUESTED':
      return { text: 'Changes Requested', color: 'orange' };
    default:
      return { text: 'Unknown', color: 'gray' };
  }
};

export function TimePeriodList({ timePeriods, onSelectTimePeriod }: TimePeriodListProps) {
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Select a Time Period</h2>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Start Date</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>End Date</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {timePeriods.map((period):JSX.Element => {
            const { text: statusText, color: statusColor } = getStatusDisplay(period.timeSheetStatus);
            return (
              <Table.Row key={period.period_id}>
                <Table.Cell>{parseISO(period.start_date).toLocaleDateString()}</Table.Cell>
                <Table.Cell>{parseISO(period.end_date).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                    {statusText}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Button 
                    onClick={() => onSelectTimePeriod(period)}
                    variant="soft"
                    color="purple"
                  >
                    View
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </div>
  )}