'use client';

import React, { useState, useEffect } from 'react';
import { DialogContent, DialogTitle } from '@radix-ui/react-dialog';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import { IScheduleEntry, IRecurrencePattern } from '@/interfaces/schedule.interfaces';
import { WorkItemPicker } from './WorkItemPicker';
import { IWorkItem } from '@/interfaces/workItem.interfaces';
import { getWorkItemById } from '@/lib/actions/workItemActions';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import SelectedWorkItem from './SelectedWorkItem';

interface EntryPopupProps {
  event: IScheduleEntry | null;
  slot: any;
  onClose: () => void;
  onSave: (entryData: Omit<IScheduleEntry, 'tenant'>) => void;
}

const EntryPopup: React.FC<EntryPopupProps> = ({ event, slot, onClose, onSave }) => {
  const [entryData, setEntryData] = useState<Omit<IScheduleEntry, 'tenant'>>({
    entry_id: '',
    title: '',
    scheduled_start: new Date(),
    scheduled_end: new Date(),
    notes: '',
    created_at: new Date(),
    updated_at: new Date(),
    work_item_id: '',
    user_id: '',
    status: '',
    work_item_type: 'project_task',
  });
  const [selectedWorkItem, setSelectedWorkItem] = useState<Omit<IWorkItem, 'tenant'> | null>(null);
  const [recurrencePattern, setRecurrencePattern] = useState<IRecurrencePattern | null>(null);
  const [isEditingWorkItem, setIsEditingWorkItem] = useState(false);

  useEffect(() => {
    if (event) {
      setEntryData({
        ...event,
        scheduled_start: new Date(event.scheduled_start),
        scheduled_end: new Date(event.scheduled_end),
      });

      // Load recurrence pattern if it exists
      if (event.recurrence_pattern) {
        setRecurrencePattern({
          ...event.recurrence_pattern,
          startDate: new Date(event.recurrence_pattern.startDate),
          endDate: event.recurrence_pattern.endDate ? new Date(event.recurrence_pattern.endDate) : undefined,
        });
      }

      // Fetch work item information if editing an existing entry
      if (event.work_item_id && event.work_item_type) {
        getWorkItemById(event.work_item_id, event.work_item_type).then((workItem) => {
          if (workItem) {
            setSelectedWorkItem(workItem);
          }
        });
      }
    } else if (slot) {
      setEntryData({
        entry_id: '',
        title: '',
        scheduled_start: new Date(slot.start),
        scheduled_end: new Date(slot.end),
        notes: '',
        created_at: new Date(),
        updated_at: new Date(),
        work_item_id: '',
        user_id: '',
        status: '',
        work_item_type: 'project_task',
      });
    }
  }, [event, slot]);

  const handleRecurrenceChange = (value: string) => {
    if (value === 'none') {
      setRecurrencePattern(null);
    } else {
      setRecurrencePattern(prev => ({
        frequency: value as IRecurrencePattern['frequency'],
        interval: 1,
        startDate: entryData.scheduled_start,
        endDate: undefined,
        count: undefined,
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEntryData((prev) => ({
      ...prev,
      [name]: name === 'scheduled_start' || name === 'scheduled_end' ? new Date(value) : value,
    }));
  };

  const handleWorkItemSelect = (workItem: IWorkItem | null) => {
    setSelectedWorkItem(workItem);
    setEntryData(prev => ({
      ...prev,
      work_item_id: workItem ? workItem.work_item_id : '',
      title: workItem ? workItem.name : prev.title,
      work_item_type: workItem?.type as "ticket" | "project_task" | "non_billable_category"
    }));
    setIsEditingWorkItem(false);
  };

  const handleSave = () => {
    const savedEntryData = {
      ...entryData,
      recurrence_pattern: recurrencePattern || null // Use null instead of undefined
    };

    // If there's no recurrence pattern, ensure it's explicitly set to null
    if (!recurrencePattern) {
      savedEntryData.recurrence_pattern = null;
    }

    onSave(savedEntryData);
  };

  return (
    <DialogContent className="bg-white p-6 rounded-lg shadow-lg fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full">
      <DialogTitle className="text-xl font-bold mb-4">
        {event ? 'Edit Entry' : 'New Entry'}
      </DialogTitle>
      <div className="space-y-4">
        <div>
          <label htmlFor="work_item" className="block text-sm font-medium text-gray-700 mb-1">
            Work Item
          </label>
          {isEditingWorkItem ? (
            <WorkItemPicker
              onSelect={handleWorkItemSelect}
              existingWorkItems={[]} // Pass existing work items if needed
              initialWorkItemId={event?.work_item_id}
              initialWorkItemType={event?.work_item_type}
            />
          ) : (
            <SelectedWorkItem
              workItem={selectedWorkItem}
              onEdit={() => setIsEditingWorkItem(true)}
            />
          )}
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={entryData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="scheduled_start" className="block text-sm font-medium text-gray-700">
            Start
          </label>
          <input
            type="datetime-local"
            id="scheduled_start"
            name="scheduled_start"
            value={format(entryData.scheduled_start, "yyyy-MM-dd'T'HH:mm")}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="scheduled_end" className="block text-sm font-medium text-gray-700">
            End
          </label>
          <input
            type="datetime-local"
            id="scheduled_end"
            name="scheduled_end"
            value={format(entryData.scheduled_end, "yyyy-MM-dd'T'HH:mm")}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={entryData.notes}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      </div>
      <div className="space-y-4">
        <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700">
          Recurrence
        </label>
        <Select.Root
          value={recurrencePattern?.frequency || 'none'}
          onValueChange={handleRecurrenceChange}
        >
          <Select.Trigger className="inline-flex items-center justify-between rounded-md px-3 py-2 text-sm leading-none gap-1 bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none">
            <Select.Value placeholder="Select frequency" />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
              <Select.Viewport className="p-1">
                <Select.Item value="none" className="text-sm leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                  <Select.ItemText>None</Select.ItemText>
                </Select.Item>
                <Select.Item value="daily" className="text-sm leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                  <Select.ItemText>Daily</Select.ItemText>
                </Select.Item>
                <Select.Item value="weekly" className="text-sm leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                  <Select.ItemText>Weekly</Select.ItemText>
                </Select.Item>
                <Select.Item value="monthly" className="text-sm leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                  <Select.ItemText>Monthly</Select.ItemText>
                </Select.Item>
                <Select.Item value="yearly" className="text-sm leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1">
                  <Select.ItemText>Yearly</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
      {recurrencePattern && (
        <div className="space-y-4">
          <div>
            <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
              Interval
            </label>
            <input
              type="number"
              id="interval"
              name="interval"
              value={recurrencePattern.interval}
              onChange={(e) => setRecurrencePattern(prev => {
                if (prev === null) return null;
                return { ...prev, interval: parseInt(e.target.value) };
              })}
              min={1}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="endType" className="block text-sm font-medium text-gray-700">
              End
            </label>
            <select
              id="endType"
              value={recurrencePattern.endDate ? 'date' : recurrencePattern.count ? 'count' : 'never'}
              onChange={(e) => {
                const value = e.target.value;
                setRecurrencePattern(prev => {
                  if (prev === null) return null;
                  return {
                    ...prev,
                    endDate: value === 'date' ? new Date() : undefined,
                    count: value === 'count' ? 1 : undefined
                  };
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="never">Never</option>
              <option value="date">On Date</option>
              <option value="count">After</option>
            </select>
          </div>
          {recurrencePattern.endDate && (
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={format(recurrencePattern.endDate, 'yyyy-MM-dd')}
                onChange={(e) => setRecurrencePattern(prev => {
                  if (prev === null) return null;
                  return { ...prev, endDate: new Date(e.target.value) };
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          )}
          {recurrencePattern.count && (
            <div>
              <label htmlFor="count" className="block text-sm font-medium text-gray-700">
                Occurrences
              </label>
              <input
                type="number"
                id="count"
                value={recurrencePattern.count}
                onChange={(e) => setRecurrencePattern(prev => {
                  if (prev === null) return null;
                  return { ...prev, count: parseInt(e.target.value) };
                })}
                min={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-end space-x-3">
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </DialogContent>
  );
};

export default EntryPopup;
