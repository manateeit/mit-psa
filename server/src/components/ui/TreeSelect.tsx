import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface TreeSelectOption {
  label: string;
  value: string;
  type: 'project' | 'phase' | 'status';
  children?: TreeSelectOption[];
}

interface TreeSelectProps {
  options: TreeSelectOption[];
  value: string;
  onValueChange: (value: string, type: 'project' | 'phase' | 'status') => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const TreeSelect: React.FC<TreeSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  label,
}): JSX.Element => {
  // Find the selected option across all levels
  const findSelectedOption = (opts: TreeSelectOption[]): TreeSelectOption | undefined => {
    for (const opt of opts) {
      if (opt.value === value) return opt;
      if (opt.children) {
        const found = findSelectedOption(opt.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  const selectedOption = findSelectedOption(options);

  const renderOption = (option: TreeSelectOption, level: number = 0): JSX.Element => {
    const paddingLeft = level * 16; // Increase padding for each level

    return (
      <React.Fragment key={option.value}>
        <RadixSelect.Item
          value={option.value}
          className={`
            relative flex items-center px-3 py-2 text-sm rounded text-gray-900
            cursor-pointer bg-white hover:bg-gray-100 focus:bg-gray-100
            focus:outline-none select-none whitespace-nowrap
          `}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          {option.children && option.children.length > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 absolute left-1" />
          )}
          <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
        </RadixSelect.Item>
        {option.children?.map(child => renderOption(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className={label ? 'mb-4' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <RadixSelect.Root 
        value={value} 
        onValueChange={(val) => {
          const findOptionType = (opts: TreeSelectOption[], searchValue: string): 'project' | 'phase' | 'status' | undefined => {
            for (const opt of opts) {
              if (opt.value === searchValue) return opt.type;
              if (opt.children) {
                const found = findOptionType(opt.children, searchValue);
                if (found) return found;
              }
            }
            return undefined;
          };
          const type = findOptionType(options, val);
          if (type) {
            onValueChange(val, type);
          }
        }}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          className={`
            inline-flex items-center justify-between
            border border-gray-200 rounded-lg p-2
            bg-white cursor-pointer min-h-[38px]
            hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            text-sm w-full
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          <RadixSelect.Value 
            placeholder={placeholder}
            className="flex-1 text-left"
          >
            {selectedOption?.label}
          </RadixSelect.Value>
          <RadixSelect.Icon>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className="overflow-hidden bg-white rounded-md shadow-lg border border-gray-200 mt-1 z-[60] w-fit min-w-[200px]"
            position="popper"
            sideOffset={4}
            align="start"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map(option => renderOption(option))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
};

export default TreeSelect;