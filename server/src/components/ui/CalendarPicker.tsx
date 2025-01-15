import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { FormFieldComponent } from '../../types/ui-reflection/types';
import { useAutomationIdAndRegister } from '@/types/ui-reflection/useAutomationIdAndRegister';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface CalendarPickerProps {
  value?: Date | null;
  onChange: (date: Date | undefined) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Unique identifier for UI reflection system */
  id: string;
}

export const CalendarPicker = React.forwardRef<HTMLDivElement, CalendarPickerProps>(
  ({ value, onChange, className, label, placeholder = 'Pick a date', disabled, required, id }, ref) => {
    const { automationIdProps: calendarProps, updateMetadata } = useAutomationIdAndRegister<FormFieldComponent>({
      type: 'formField',
      fieldType: 'textField',
      id,
      label,
      value: value?.toISOString(),
      disabled,
      required
    });

    return (
      <div className={cn('flex flex-col space-y-1', className)} ref={ref}>
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50',
                !value && 'text-gray-500',
                value && 'bg-primary-100',
                disabled && 'opacity-50 cursor-not-allowed bg-gray-100'
              )}
              disabled={disabled}
              id={id}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              {value ? (
                <span className="text-gray-700">{format(value, 'MM/dd/yyyy')}</span>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-white rounded-md shadow-lg border border-gray-200 z-50" 
            sideOffset={4}
            align="start"
            side="bottom"
          >
            <div className="p-3">
              <DayPicker
                mode="single"
                selected={value || undefined}
                onSelect={(date) => onChange(date)}
                disabled={disabled}
                showOutsideDays={false}
                className={cn(
                  "rounded-md border-0",
                  // Day cell styles
                  "[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:text-sm [&_.rdp-day]:font-normal",
                  "[&_.rdp-day_not(.rdp-day_selected)]:hover:bg-primary-50",
                  "[&_.rdp-day_selected]:bg-primary-100 [&_.rdp-day_selected]:text-gray-700",
                  "[&_.rdp-day_selected]:hover:bg-primary-200",
                  "[&_.rdp-day]:focus:ring-purple-500",
                  // Header styles
                  "[&_.rdp-head_cell]:text-sm [&_.rdp-head_cell]:font-normal [&_.rdp-head_cell]:text-gray-500",
                  // Button hover styles
                  "[&_.rdp-button:hover:not(&_rdp-day_selected)]:bg-primary-50",
                  // Navigation button styles
                  "[&_.rdp-nav_button]:hover:bg-primary-50 [&_.rdp-nav_button]:opacity-75 [&_.rdp-nav_button]:hover:opacity-100",
                  "[&_.rdp-nav_button]:text-gray-700 [&_.rdp-nav_button]:focus:ring-purple-500",
                  // Caption styles
                  "[&_.rdp-caption]:text-sm [&_.rdp-caption]:font-medium [&_.rdp-caption]:text-gray-700",
                  // Focus ring styles
                  "[&_button:focus]:ring-purple-500 [&_button:focus]:ring-2 [&_button:focus]:ring-offset-0",
                  "[&_button:focus-visible]:ring-purple-500 [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-offset-0"
                )}
                classNames={{
                  nav_button_previous: "text-gray-700 hover:bg-primary-50 hover:text-gray-900",
                  nav_button_next: "text-gray-700 hover:bg-primary-50 hover:text-gray-900"
                }}
                {...calendarProps}
              />
              <div className="mt-3 flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-gray-500"
                  onClick={() => onChange(undefined)}
                  id={`${id}-clear-button`}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-100 hover:bg-primary-200 text-gray-700"
                  onClick={() => onChange(new Date())}
                  id={`${id}-today-button`}
                >
                  Today
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

CalendarPicker.displayName = 'CalendarPicker';
