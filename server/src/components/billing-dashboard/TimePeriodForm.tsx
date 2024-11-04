// TimePeriodForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { createTimePeriod } from '@/lib/actions/timePeriodsActions';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';
import { Checkbox } from '@/components/ui/Checkbox';
import { ISO8601String } from '@/types/types.d';
import { parseISO, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, isEqual, format, setDate, setMonth, endOfMonth } from 'date-fns';

interface TimePeriodFormProps {
    isOpen: boolean;
    onClose: () => void;
    onTimePeriodCreated: (newPeriod: ITimePeriod) => void;
    settings: ITimePeriodSettings | null;
    existingTimePeriods: ITimePeriod[];
}

const TimePeriodForm: React.FC<TimePeriodFormProps> = ({
    isOpen,
    onClose,
    onTimePeriodCreated,
    settings,
    existingTimePeriods,
}) => {
    const [startDate, setStartDate] = useState<ISO8601String>('');
    const [endDate, setEndDate] = useState<ISO8601String>('');
    const [error, setError] = useState<string | null>(null);
    const [override, setOverride] = useState<boolean>(false);

    useEffect(() => {
        if (settings) {
            let newStartDate: Date;
            if (existingTimePeriods.length > 0) {
                // Calculate the next period based on settings and existing periods
                const lastPeriod = existingTimePeriods.sort((a, b) =>
                    parseISO(b.end_date).getTime() - parseISO(a.end_date).getTime()
                )[0];
                newStartDate = addDays(parseISO(lastPeriod.end_date), 1);
            } else {
                // If no existing periods, start from settings.effective_from or today's date
                const effectiveFromDate = parseISO(settings.effective_from);
                newStartDate = isAfter(effectiveFromDate, new Date()) ? effectiveFromDate : new Date();
            }

            // Adjust start date based on settings
            newStartDate = adjustStartDate(newStartDate, settings);

            const newEndDate = calculateEndDate(newStartDate, settings);

            setStartDate(format(newStartDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
            setEndDate(format(newEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
            setError(null);
        } else {
            setStartDate('');
            setEndDate('');
            setError('No time period settings available. Unable to create a new time period.');
        }
    }, [settings, existingTimePeriods]);

    // Helper function to adjust start date based on settings
    function adjustStartDate(date: Date, settings: ITimePeriodSettings): Date {
        switch (settings.frequency_unit) {
            case 'week':
                return setDate(date, settings.start_day || 1);
            case 'month':
                return setDate(date, settings.start_day || 1);
            case 'year':
                return setDate(setMonth(date, (settings.start_month || 1) - 1), settings.start_day_of_month || 1);
            default:
                return date;
        }
    }

    // Helper function to calculate end date
    function calculateEndDate(start: Date, settings: ITimePeriodSettings): Date {
        let end: Date;
        switch (settings.frequency_unit) {
            case 'day':
                end = addDays(start, settings.frequency - 1);
                break;
            case 'week':
                end = addWeeks(start, settings.frequency);
                end = setDate(end, settings.end_day || 7);
                break;
            case 'month':
                end = addMonths(start, settings.frequency);
                end = setDate(end, settings.end_day || 0);
                if (settings.end_day === 0 || (settings.end_day && settings.end_day > 28)) {
                    end = endOfMonth(end);
                }
                break;
            case 'year':
                end = addYears(start, settings.frequency);
                end = setMonth(end, (settings.end_month || 12) - 1);
                end = setDate(end, settings.end_day_of_month || 0);
                if (settings.end_day_of_month === 0 || (settings.end_day_of_month && settings.end_day_of_month > 28)) {
                    end = endOfMonth(end);
                }
                break;
            default:
                end = start;
        }
        return addDays(end, -1); // Adjust to make the end date inclusive
    }

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value ? format(parseISO(e.target.value), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : '';
        setStartDate(newDate);
        if (settings && !override) {
            const newEndDate = calculateEndDate(parseISO(newDate), settings);
            setEndDate(format(newEndDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value ? format(parseISO(e.target.value), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : '';
        setEndDate(newDate);
    };

    const handleSubmit = async () => {
        if (!settings) {
            setError('Cannot create a time period without settings.');
            return;
        }

        try {
            // Client-side validations
            if (!startDate || !endDate) {
                setError('Both start date and end date must be provided.');
                return;
            }

            if (!isBefore(parseISO(startDate), parseISO(endDate))) {
                setError('Start date must be before end date.');
                return;
            }

            const overlappingPeriod = existingTimePeriods.find((period) => {
                const existingStart = parseISO(period.start_date);
                const existingEnd = parseISO(period.end_date);
                const newStart = parseISO(startDate);
                const newEnd = parseISO(endDate);
                return (
                    (isEqual(newStart, existingStart) || isAfter(newStart, existingStart)) && (isEqual(newStart, existingEnd) || isBefore(newStart, existingEnd)) ||
                    (isEqual(newEnd, existingStart) || isAfter(newEnd, existingStart)) && (isEqual(newEnd, existingEnd) || isBefore(newEnd, existingEnd)) ||
                    (isBefore(newStart, existingStart) && isAfter(newEnd, existingEnd))
                );
            });

            if (overlappingPeriod) {
                setError('The new time period overlaps with an existing period.');
                return;
            }

            const newPeriod = await createTimePeriod({
                start_date: startDate,
                end_date: endDate
            });

            onTimePeriodCreated(newPeriod);
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                // Handle the specific overlap error
                if (err.message === 'The new time period overlaps with an existing period.') {
                    setError('This time period overlaps with an existing one. Please choose different dates.');
                } else {
                    setError(err.message || 'Failed to create time period.');
                }
            } else {
                // If it's not an Error object, we can't assume it has a 'message' property
                setError('An unexpected error occurred.');
            }
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Time Period">
            <div className="p-4">
                {error && <div className="text-red-600 mb-2">{error}</div>}
                {settings ? (
                    <>
                        <div className="mb-4">
                            <p>Based on your settings, the next time period is suggested.</p>
                            <p>
                                Frequency: {settings.frequency} {settings.frequency_unit}(s)
                            </p>
                        </div>
                        <div className="mb-4">
                            <Checkbox
                                label="Override suggested dates"
                                checked={override}
                                onChange={(e) => setOverride(e.target.checked)}
                            />
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                type="date"
                                id="startDate"
                                value={startDate ? format(parseISO(startDate), 'yyyy-MM-dd') : ''}
                                onChange={handleStartDateChange}
                                readOnly={!override}
                            />
                        </div>
                        <div className="mb-4">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                type="date"
                                id="endDate"
                                value={endDate ? format(parseISO(endDate), 'yyyy-MM-dd') : ''}
                                onChange={handleEndDateChange}
                                readOnly={!override}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={onClose} className="mr-2">
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>Create</Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <Button variant="outline" onClick={onClose} className="mt-4">
                            Close
                        </Button>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default TimePeriodForm;
