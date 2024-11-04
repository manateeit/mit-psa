'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';
import TimePeriodForm from './TimePeriodForm';
import { getTimePeriodSettings } from '@/lib/actions/timePeriodsActions';
import { ISO8601String } from '@/types/types.d';
import { parseISO, format } from 'date-fns'; // Import date-fns functions

interface TimePeriodsProps {
  initialTimePeriods: ITimePeriod[];
}

const TimePeriods: React.FC<TimePeriodsProps> = ({ initialTimePeriods }) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [timePeriods, setTimePeriods] = useState<ITimePeriod[]>(initialTimePeriods);
  const [settings, setSettings] = useState<ITimePeriodSettings | null>(null);

  const handleTimePeriodCreated = (newPeriod: ITimePeriod) => {
    setTimePeriods([...timePeriods, newPeriod]);
  };

  useEffect(() => {
    async function fetchSettings() {
      const timePeriodSettings = await getTimePeriodSettings();
      // Assuming we only have one active setting
      setSettings(timePeriodSettings[0]);
    }
    fetchSettings();
  }, []);

  // Function to format ISO8601 string to a readable date string
  const formatDate = (isoString: ISO8601String): string => {
    return format(parseISO(isoString), 'PPP'); // 'PPP' gives format like "April 29, 2023"
  };

  return (
    <>
      <Button className="mb-4" onClick={() => setIsFormOpen(true)}>
        Create New Time Period
      </Button>
      <TimePeriodForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onTimePeriodCreated={handleTimePeriodCreated}
        settings={settings}
        existingTimePeriods={timePeriods}
      />
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Time Period Management</h3>
          <p className="text-sm text-gray-500">Manage billing cycles and time periods</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timePeriods.map((period): JSX.Element => (
                <TableRow key={period.period_id}>
                  <TableCell>{formatDate(period.start_date)}</TableCell>
                  <TableCell>{formatDate(period.end_date)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default TimePeriods;
