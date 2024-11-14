import React from 'react';
import { ChevronDown } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface StyleProps {
  trigger: string;
  content: string;
  item: string;
  itemIndicator: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  customStyles?: StyleProps;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  customStyles,
}) => {
  const selectedOption = options.find(option => option.value === value);

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  customStyles?: {
    trigger?: string;
    content?: string;
    item?: string;
    itemIndicator?: string;
  };
}

export const CustomSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className = '',
  customStyles,
}: CustomSelectProps): JSX.Element => {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={`
          inline-flex items-center justify-between
          border border-gray-300 rounded-lg p-2
          bg-white cursor-pointer min-h-[38px]
          hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          min-w-[150px] text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
          ${customStyles?.trigger || ''}
        `}
      >
        <Select.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={`
            overflow-hidden bg-white rounded-md shadow-lg
            border border-gray-200 mt-1
            ${customStyles?.content || ''}
          `}
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={`
                  relative flex items-center px-3 py-2 text-sm rounded
                  cursor-pointer hover:bg-gray-100 focus:bg-gray-100
                  focus:outline-none select-none
                  ${customStyles?.item || ''}
                `}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                {customStyles?.itemIndicator && (
                  <Select.ItemIndicator className={customStyles.itemIndicator}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
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