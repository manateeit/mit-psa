import React, { useState, useEffect } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface TreeSelectOption<T extends string = string> {
  label: string;
  value: string;
  type: T;
  children?: TreeSelectOption<T>[];
}

export interface TreeSelectPath {
  [key: string]: string;
}

interface TreeSelectProps<T extends string = string> {
  options: TreeSelectOption<T>[];
  value: string;
  onValueChange: (value: string, type: T, path?: TreeSelectPath) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  selectedClassName?: string;
  hoverClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

function TreeSelect<T extends string>({
  options,
  value,
  onValueChange,
  placeholder,
  className,
  disabled,
  label,
  selectedClassName = 'bg-gray-100',
  hoverClassName = 'hover:bg-gray-100',
  triggerClassName = 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
  contentClassName = 'bg-white rounded-md shadow-lg border border-gray-200',
}: TreeSelectProps<T>): JSX.Element {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [displayLabel, setDisplayLabel] = useState<string>('');

  // Find the selected option and its ancestors
  const findSelectedOptionWithPath = (
    opts: TreeSelectOption<T>[],
    targetValue: string,
    parentPath: TreeSelectOption<T>[] = []
  ): { option: TreeSelectOption<T>; path: TreeSelectOption<T>[] } | undefined => {
    for (const opt of opts) {
      const currentPath = [...parentPath, opt];
      if (opt.value === targetValue) {
        return { option: opt, path: currentPath };
      }
      if (opt.children) {
        const found = findSelectedOptionWithPath(opt.children, targetValue, currentPath);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Update expanded items and display label when value changes
  useEffect(() => {
    if (value) {
      setSelectedValue(value);
      const result = findSelectedOptionWithPath(options, value);
      if (result) {
        // Expand all parent nodes
        setExpandedItems(prev => {
          const next = new Set(prev);
          result.path.forEach((p: TreeSelectOption<T>): void => {
            next.add(p.value);
          });
          return next;
        });

        // Build the path object
        const pathObj: TreeSelectPath = {};
        result.path.forEach((opt: TreeSelectOption<T>): void => {
          pathObj[opt.type] = opt.value;
        });

        // Set display label to show the full path
        const labels = result.path.map((p: TreeSelectOption<T>): string => p.label);
        setDisplayLabel(labels.join(' > '));
      }
    }
  }, [value, options]);

  const toggleExpand = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(optionValue)) {
        next.delete(optionValue);
      } else {
        next.add(optionValue);
      }
      return next;
    });
  };

  const handleSelect = (option: TreeSelectOption<T>, ancestors: TreeSelectOption<T>[], e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    // Build the full path including the selected option
    const fullPath = [...ancestors, option];
    const pathObj: TreeSelectPath = {};
    fullPath.forEach((opt: TreeSelectOption<T>): void => {
      pathObj[opt.type] = opt.value;
    });

    setSelectedValue(option.value);
    
    // Set display label to show the full path
    const labels = fullPath.map((p: TreeSelectOption<T>): string => p.label);
    setDisplayLabel(labels.join(' > '));

    onValueChange(option.value, option.type, pathObj);

    // Close the dropdown only for leaf nodes
    if (!option.children?.length) {
      setIsOpen(false);
    }
  };

  const renderOption = (
    option: TreeSelectOption<T>, 
    level: number = 0,
    ancestors: TreeSelectOption<T>[] = []
  ): JSX.Element => {
    const isExpanded = expandedItems.has(option.value);
    const hasChildren = option.children && option.children.length > 0;
    const isSelected = option.value === selectedValue;

    return (
      <React.Fragment key={option.value}>
        <div
          className={`
            relative flex items-center py-2 text-sm rounded text-gray-900
            bg-white select-none whitespace-nowrap pl-3
            ${hoverClassName}
            ${isSelected ? selectedClassName : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center min-w-0">
            {hasChildren && (
              <div 
                className="flex-shrink-0 cursor-pointer p-0.5 hover:text-gray-900 rounded transition-colors mr-1"
                onClick={(e) => toggleExpand(option.value, e)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </div>
            )}
            {!hasChildren && <div className="w-5" />}
            <div 
              className="cursor-pointer truncate"
              onClick={(e) => handleSelect(option, ancestors, e)}
            >
              {option.label}
            </div>
          </div>
        </div>
        {isExpanded && option.children?.map((child: TreeSelectOption<T>): JSX.Element => 
          renderOption(child, level + 1, [...ancestors, option])
        )}
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
        value={selectedValue}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          className={`
            inline-flex items-center justify-between
            border border-gray-200 rounded-lg p-2
            bg-white cursor-pointer min-h-[38px]
            disabled:opacity-50 disabled:cursor-not-allowed
            text-sm w-full
            ${triggerClassName}
            ${className}
          `}
        >
          <RadixSelect.Value 
            placeholder={placeholder}
            className="flex-1 text-left"
          >
            {displayLabel || placeholder}
          </RadixSelect.Value>
          <RadixSelect.Icon>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={`overflow-hidden mt-1 z-[60] w-fit min-w-[200px] ${contentClassName}`}
            position="popper"
            sideOffset={4}
            align="start"
            avoidCollisions={true}
            sticky="always"
          >
            <RadixSelect.Viewport className="p-1 max-h-[300px] overflow-y-auto">
              {options.map((option: TreeSelectOption<T>): JSX.Element => renderOption(option))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}

export default TreeSelect;
