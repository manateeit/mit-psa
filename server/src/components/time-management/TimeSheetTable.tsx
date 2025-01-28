'use client'

import React from 'react';
import { ITimeEntryWithWorkItem } from '@/interfaces/timeEntry.interfaces';
import { IExtendedWorkItem } from '@/interfaces/workItem.interfaces';
import { formatISO, parseISO } from 'date-fns';

interface TimeSheetTableProps {
    dates: Date[];
    workItemsByType: Record<string, IExtendedWorkItem[]>;
    groupedTimeEntries: Record<string, ITimeEntryWithWorkItemString[]>;
    isEditable: boolean;
    onCellClick: (params: {
        workItem: IExtendedWorkItem;
        date: string;
        entries: ITimeEntryWithWorkItemString[];
        defaultStartTime?: string;
        defaultEndTime?: string;
    }) => void;
    onAddWorkItem: () => void;
    onWorkItemClick: (workItem: IExtendedWorkItem) => void;
}

interface ITimeEntryWithWorkItemString extends Omit<ITimeEntryWithWorkItem, 'start_time' | 'end_time'> {
    start_time: string;
    end_time: string;
}

type BillabilityPercentage = 0 | 25 | 50 | 75 | 100;

const billabilityColorScheme: Record<BillabilityPercentage, {
    background: string;
    border: string;
}> = {
    100: {
        background: "rgb(var(--color-primary-100))",
        border: "rgb(var(--color-primary-300))"
    },
    75: {
        background: "rgb(var(--color-secondary-100))",
        border: "rgb(var(--color-secondary-300))"
    },
    50: {
        background: "rgb(var(--color-accent-50))",
        border: "rgb(var(--color-accent-300))"
    },
    25: {
        background: "rgb(var(--color-accent-50))",
        border: "rgb(var(--color-accent-300))"
    },
    0: {
        background: "rgb(var(--color-border-50))",
        border: "rgb(var(--color-border-300))"
    }
} as const;

function formatWorkItemType(type: string): string {
    const words = type.split(/[_\s]+/);
    return words.map((word): string =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}

export function TimeSheetTable({
    dates,
    workItemsByType,
    groupedTimeEntries,
    isEditable,
    onCellClick,
    onAddWorkItem,
    onWorkItemClick
}: TimeSheetTableProps): JSX.Element {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                    <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[4px_0_6px_rgba(0,0,0,0.1)] sticky left-0 z-20 min-w-fit max-w-[15%] whitespace-nowrap truncate bg-gray-50">
                            Work Item
                        </th>
                        {dates.map((date): JSX.Element => (
                            <th key={date.toLocaleDateString()} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                {date.toLocaleDateString()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    <tr className="h-10 bg-primary-100">
                        <td
                            colSpan={1}
                            className="px-6 py-3 whitespace-nowrap text-xs text-gray-400 cursor-pointer relative shadow-[4px_0_6px_rgba(0,0,0,0.1)] sticky left-0 z-10 w-[25vw] truncate bg-primary-100"
                            onClick={onAddWorkItem}
                        >
                            + Add new work item
                        </td>
                        <td colSpan={dates.length} className=""></td>
                    </tr>
                    {Object.entries(workItemsByType).map(([type, workItems]): JSX.Element => (
                        <React.Fragment key={type}>
                            {workItems.map((workItem): JSX.Element => {
                                const entries = groupedTimeEntries[workItem.work_item_id] || [];
                                return (
                                    <tr key={`${workItem.work_item_id}-${Math.random()}`}>
                                        <td 
                                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 shadow-[4px_0_6px_rgba(0,0,0,0.1)] border-t border-b sticky left-0 z-10 bg-white min-w-fit max-w-[15%] truncate bg-white cursor-pointer hover:bg-gray-50"
                                            onClick={() => onWorkItemClick(workItem)}
                                        >
                                        <div className="flex flex-col">
                                            <span>
                                                {workItem.type === 'ticket'
                                                    ? `${workItem.ticket_number} - ${workItem.title || workItem.name}`
                                                    : workItem.name
                                                }
                                            </span>
                                            {workItem.type === 'project_task' && workItem.project_name && workItem.phase_name && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {workItem.project_name} • {workItem.phase_name}
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-500 mt-1">{formatWorkItemType(workItem.type)}</span>
                                        </div>
                                        </td>
                                        {dates.map((date): JSX.Element => {
                                            const dayEntries = entries.filter(entry =>
                                                parseISO(entry.start_time).toDateString() === date.toDateString()
                                            );
                                            const totalDuration = dayEntries.reduce((sum, entry) => {
                                                const duration = (parseISO(entry.end_time).getTime() - parseISO(entry.start_time).getTime()) / 60000;
                                                return sum + duration;
                                            }, 0);
                                            const totalBillableDuration = dayEntries.reduce((sum, entry) => sum + entry.billable_duration, 0);

                                            let colors = billabilityColorScheme[0];
                                            if (totalDuration > 0) {
                                                const percentage = (totalBillableDuration / totalDuration) * 100;
                                                if (percentage === 100) colors = billabilityColorScheme[100];
                                                else if (percentage >= 75) colors = billabilityColorScheme[75];
                                                else if (percentage >= 50) colors = billabilityColorScheme[50];
                                                else if (percentage >= 25) colors = billabilityColorScheme[25];
                                            }

                                            return (
                                                <td
                                                    key={formatISO(date)}
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer border transition-colors relative min-h-[100px]"
                                                    onClick={() => {
                                                        if (!isEditable) return;
                                                        
                                                        let startTime, endTime;

                                                        if (workItem.type === 'ad_hoc' && 
                                                            'scheduled_start' in workItem && 
                                                            'scheduled_end' in workItem && 
                                                            workItem.scheduled_start && 
                                                            workItem.scheduled_end) {
                                                            startTime = typeof workItem.scheduled_start === 'string' ? 
                                                                parseISO(workItem.scheduled_start) : 
                                                                workItem.scheduled_start;
                                                            endTime = typeof workItem.scheduled_end === 'string' ? 
                                                                parseISO(workItem.scheduled_end) : 
                                                                workItem.scheduled_end;
                                                        }

                                                        if (!startTime && dayEntries.length > 0) {
                                                            const sortedEntries = [...dayEntries].sort((a, b) => 
                                                                parseISO(b.end_time).getTime() - parseISO(a.end_time).getTime()
                                                            );
                                                            startTime = parseISO(sortedEntries[0].end_time);
                                                            endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
                                                        } else if (!startTime) {
                                                            startTime = new Date(date);
                                                            startTime.setHours(8, 0, 0, 0);
                                                            endTime = new Date(startTime);
                                                            endTime.setHours(9, 0, 0, 0);
                                                        }

                                                        onCellClick({
                                                            workItem,
                                                            date: formatISO(date),
                                                            entries: dayEntries,
                                                            defaultStartTime: startTime ? formatISO(startTime) : undefined,
                                                            defaultEndTime: endTime ? formatISO(endTime) : undefined
                                                        });
                                                    }}
                                                >
                                                    {dayEntries.length > 0 && (
                                                        <div
                                                            className="rounded-lg p-2 text-xs shadow-sm h-full w-full"
                                                            style={{
                                                                backgroundColor: colors.background,
                                                                borderColor: colors.border,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid'
                                                            }}
                                                        >
                                                            <div>
                                                                <div className="font-medium text-gray-700">{`Total: ${formatDuration(totalDuration)}`}</div>
                                                                <div className="text-gray-600">{`Billable: ${formatDuration(totalBillableDuration)}`}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>

                <tfoot>
                    <tr className="shadow-[0px_-4px_6px_rgba(0,0,0,0.1)]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r z-10 min-w-fit max-w-[15%] shadow-[4px_0_6px_rgba(0,0,0,0.1)] sticky left-0 bg-white">Total</td>
                        {dates.map((date): JSX.Element => {
                            const totalDuration = Object.values(groupedTimeEntries).flat()
                                .filter((entry) => parseISO(entry.start_time).toDateString() === date.toDateString())
                                .reduce((sum, entry) => {
                                    const duration = (parseISO(entry.end_time).getTime() - parseISO(entry.start_time).getTime()) / 60000;
                                    return sum + duration;
                                }, 0);
                            const totalBillableDuration = Object.values(groupedTimeEntries).flat()
                                .filter((entry) => parseISO(entry.start_time).toDateString() === date.toDateString())
                                .reduce((sum, entry) => sum + entry.billable_duration, 0);
                            return (
                                <td key={formatISO(date)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                    <div>{`Total: ${formatDuration(totalDuration)}`}</div>
                                    <div>{`Billable: ${formatDuration(totalBillableDuration)}`}</div>
                                </td>
                            );
                        })}
                    </tr>
                </tfoot>
            </table>

            <div className="mt-4">
                <h3 className="text-lg font-medium">Legend</h3>
                <div className="flex space-x-4">
                    {(Object.entries(billabilityColorScheme) as [string, { background: string; border: string; }][]).map(([percentage, colors]): JSX.Element => (
                        <div key={percentage} className="flex items-center">
                            <div
                                className="w-4 h-4 mr-2 border"
                                style={{
                                    backgroundColor: colors.background,
                                    borderColor: colors.border
                                }}
                            ></div>
                            <span>{percentage}% Billable</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
