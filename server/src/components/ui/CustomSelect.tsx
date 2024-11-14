// components/CustomSelect.tsx
import React from 'react';
import { SelectOption } from './Select';
import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  customStyles?: {
    trigger?: string;
    content?: string;
    item?: string;
    itemIndicator?: string;
  };
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  customStyles
}) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={customStyles?.trigger || "inline-flex items-center justify-between border border-gray-300 rounded-lg p-2 bg-white cursor-pointer min-h-[38px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px] text-sm"}
      >
        <Select.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={customStyles?.content || "overflow-hidden bg-white rounded-md shadow-lg border border-gray-200 mt-1"}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={customStyles?.item || "relative flex items-center px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none select-none"}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                {customStyles?.itemIndicator && (
                  <Select.ItemIndicator className={customStyles.itemIndicator}>
                    <CheckIcon />
                  </Select.ItemIndicator>
                )}
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export default CustomSelect;
