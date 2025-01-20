import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutomationIdAndRegister } from '@/types/ui-reflection/useAutomationIdAndRegister';
import { TimePickerComponent } from '@/types/ui-reflection/types';

export interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Unique identifier for UI reflection system */
  id?: string;
  /** Human-readable label for accessibility */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
}

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ value, onChange, placeholder = 'Select time', className, disabled, id, label, required }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [selectedHour, setSelectedHour] = React.useState(value ? value.split(':')[0] : '00');
    const [selectedMinute, setSelectedMinute] = React.useState(value ? value.split(':')[1] : '00');
    const [period, setPeriod] = React.useState(
      value ? (parseInt(value.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM'
    );
    
    // Register with UI reflection system if id is provided
    const { automationIdProps, updateMetadata } = useAutomationIdAndRegister<TimePickerComponent>({
      type: 'timePicker',
      id,
      label: label || placeholder,
      value,
      disabled,
      required,
      actions: ['open', 'select']
    });

    // Update metadata when field props change
    React.useEffect(() => {
      if (updateMetadata) {
        updateMetadata({
          value,
          disabled,
          required
        });
      }
    }, [value, disabled, required, updateMetadata]);

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    const handleTimeChange = (hour: string, minute: string, newPeriod: string) => {
      let h = parseInt(hour);
      if (newPeriod === 'PM' && h !== 12) h += 12;
      if (newPeriod === 'AM' && h === 12) h = 0;
      const formattedHour = String(h).padStart(2, '0');
      onChange(`${formattedHour}:${minute}`);
    };

    const displayValue = value ? 
      `${selectedHour}:${selectedMinute} ${period}` : 
      placeholder;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newValue)) {
        onChange(newValue);
        const hour = parseInt(newValue.split(':')[0]);
        const minute = newValue.split(':')[1];
        setSelectedHour(String(hour % 12 || 12).padStart(2, '0'));
        setSelectedMinute(minute);
        setPeriod(hour >= 12 ? 'PM' : 'AM');
      }
    };

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className={className} ref={ref}>
          <div className="relative flex items-center">
            <input
              type="time"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              className={`
                w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
                file:border-0 file:bg-transparent file:text-sm file:font-medium 
                placeholder:text-gray-500
                hover:border-gray-400
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
                disabled:cursor-not-allowed disabled:opacity-50
                [appearance:textfield]
                [&::-webkit-calendar-picker-indicator]:hidden
              `}
              {...automationIdProps}
            />
            <Popover.Trigger
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md"
              disabled={disabled}
              aria-label={label || placeholder}
            >
              <Clock className="h-4 w-4 opacity-50" />
            </Popover.Trigger>
          </div>

          <Popover.Portal>
            <Popover.Content
              className="z-50 w-64 p-3 bg-white border border-gray-200 rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
              align="start"
              sideOffset={4}
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Hour</label>
                  <div 
                    className="h-[160px] overflow-y-auto"
                    onWheel={(e) => {
                      e.currentTarget.scrollTop += e.deltaY;
                      e.preventDefault();
                    }}
                  >
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        onClick={() => {
                          setSelectedHour(hour);
                          handleTimeChange(hour, selectedMinute, period);
                        }}
                        className={cn(
                          'w-full px-2 py-1 text-left text-sm rounded-md',
                          selectedHour === hour
                            ? 'bg-purple-100 text-purple-900'
                            : 'hover:bg-gray-100'
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Minute</label>
                  <div 
                    className="h-[160px] overflow-y-auto"
                    onWheel={(e) => {
                      e.currentTarget.scrollTop += e.deltaY;
                      e.preventDefault();
                    }}
                  >
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        onClick={() => {
                          setSelectedMinute(minute);
                          handleTimeChange(selectedHour, minute, period);
                        }}
                        className={cn(
                          'w-full px-2 py-1 text-left text-sm rounded-md',
                          selectedMinute === minute
                            ? 'bg-purple-100 text-purple-900'
                            : 'hover:bg-gray-100'
                        )}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Period</label>
                  <div>
                    {['AM', 'PM'].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPeriod(p);
                          handleTimeChange(selectedHour, selectedMinute, p);
                        }}
                        className={cn(
                          'w-full px-2 py-1 text-left text-sm rounded-md',
                          period === p
                            ? 'bg-purple-100 text-purple-900'
                            : 'hover:bg-gray-100'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </div>
      </Popover.Root>
    );
  }
);

TimePicker.displayName = 'TimePicker';
