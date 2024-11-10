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
  placeholder = 'Select...'
}) => {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className="inline-flex items-center justify-between border border-gray-300 rounded-lg p-2 bg-white cursor-pointer min-h-[38px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px] text-sm"
      >
        <Select.Value placeholder={placeholder} className="text-gray-500">
          {options.find(option => option.value === value)?.label || placeholder}
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200 mt-1"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((option):JSX.Element => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex items-center px-3 py-2 text-sm rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none select-none"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default CustomSelect;
