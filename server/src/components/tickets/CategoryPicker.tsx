import React, { useMemo } from 'react';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';
import TreeSelect, { TreeSelectOption, TreeSelectPath } from '@/components/ui/TreeSelect';

interface CategoryPickerProps {
  categories: ITicketCategory[];
  selectedCategories: string[];
  excludedCategories?: string[];
  onSelect: (categoryIds: string[], excludedIds: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  className?: string;
  containerClassName?: string;
  showExclude?: boolean;
  showReset?: boolean;
  allowEmpty?: boolean;
}

type CategoryType = 'parent' | 'child';

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  excludedCategories = [],
  onSelect,
  placeholder = 'Select categories...',
  multiSelect = false,
  className = '',
  showExclude = false,
  showReset = false,
  allowEmpty = false,
}) => {
  // Transform categories into TreeSelect format
  const treeOptions = useMemo((): TreeSelectOption<CategoryType>[] => {
    // First, separate parents and children
    const parentCategories = categories.filter(c => !c.parent_category);
    const childrenMap = new Map<string, ITicketCategory[]>();
    
    // Group children by parent
    categories.filter(c => c.parent_category).forEach(child => {
      if (!childrenMap.has(child.parent_category!)) {
        childrenMap.set(child.parent_category!, []);
      }
      childrenMap.get(child.parent_category!)?.push(child);
    });

    // Transform into tree structure with selected and excluded states
    const categoryOptions = parentCategories.map(parent => ({
      label: parent.category_name,
      value: parent.category_id,
      type: 'parent' as CategoryType,
      selected: selectedCategories.includes(parent.category_id),
      excluded: excludedCategories.includes(parent.category_id),
      children: childrenMap.get(parent.category_id)?.map(child => ({
        label: child.category_name,
        value: child.category_id,
        type: 'child' as CategoryType,
        selected: selectedCategories.includes(child.category_id),
        excluded: excludedCategories.includes(child.category_id),
      })) || undefined
    }));

    // Add "No Category" option at the beginning
    return [
      {
        label: 'No Category',
        value: 'no-category',
        type: 'parent' as CategoryType,
        selected: selectedCategories.includes('no-category'),
        excluded: excludedCategories.includes('no-category'),
      },
      ...categoryOptions
    ];
  }, [categories, selectedCategories, excludedCategories]);

  // Handle selection changes
  const handleValueChange = (value: string, type: CategoryType, excluded: boolean, path?: TreeSelectPath) => {
    // Handle reset action
    if (value === '') {
      onSelect([], []); // Clear both selected and excluded categories
      return;
    }

    if (multiSelect) {
      if (excluded) {
        // Handle excluded categories
        const newExcluded = excludedCategories.includes(value)
          ? excludedCategories.filter(id => id !== value)
          : [...excludedCategories, value];
        // Remove from selected if it was there
        const newSelection = selectedCategories.filter(id => id !== value);
        onSelect(newSelection, newExcluded);
      } else {
        // Handle included categories
        const newSelection = selectedCategories.includes(value)
          ? selectedCategories.filter(id => id !== value)
          : [...selectedCategories, value];
        // Remove from excluded if it was there
        const newExcluded = excludedCategories.filter(id => id !== value);
        onSelect(newSelection, newExcluded);
      }
    } else {
      // For single-select, just use the new value
      onSelect([value], []);
    }
  };

  // Update display label to show both selected and excluded categories
  const currentValue = selectedCategories[0] || '';
  const displayLabel = useMemo(() => {
    const parts = [];
    
    if (selectedCategories.length > 0) {
      const selectedText = selectedCategories.length === 1
        ? selectedCategories[0] === 'no-category'
          ? 'No Category'
          : categories.find(c => c.category_id === selectedCategories[0])?.category_name
        : `${selectedCategories.length} categories`;
      if (selectedText) parts.push(selectedText);
    }
    
    if (excludedCategories.length > 0) {
      const excludedText = excludedCategories.length === 1
        ? excludedCategories[0] === 'no-category'
          ? 'excluding No Category'
          : `excluding ${categories.find(c => c.category_id === excludedCategories[0])?.category_name}`
        : `excluding ${excludedCategories.length} categories`;
      parts.push(excludedText);
    }
    
    return parts.join(', ') || '';
  }, [selectedCategories, excludedCategories, categories]);

  return (
    <TreeSelect
      options={treeOptions}
      value={currentValue}
      onValueChange={handleValueChange}
      placeholder={displayLabel || placeholder}
      className={className}
      selectedClassName="bg-gray-50"
      hoverClassName="hover:bg-gray-50"
      triggerClassName="hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      contentClassName="bg-white rounded-md shadow-lg border border-gray-200"
      multiSelect={multiSelect}
      showExclude={showExclude}
      showReset={true}
      allowEmpty={true}
    />
  );
};

export default CategoryPicker;
