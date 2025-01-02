import React, { useMemo } from 'react';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';
import TreeSelect, { TreeSelectOption, TreeSelectPath } from '@/components/ui/TreeSelect';

interface CategoryPickerProps {
  categories: ITicketCategory[];
  selectedCategories: string[];
  onSelect: (categoryIds: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  className?: string;
  containerClassName?: string;
}

type CategoryType = 'parent' | 'child';

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onSelect,
  placeholder = 'Select categories...',
  multiSelect = false,
  className = '',
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

    // Transform into tree structure
    return parentCategories.map(parent => ({
      label: parent.category_name,
      value: parent.category_id,
      type: 'parent' as CategoryType,
      children: childrenMap.get(parent.category_id)?.map(child => ({
        label: child.category_name,
        value: child.category_id,
        type: 'child' as CategoryType,
      })) || undefined
    }));
  }, [categories]);

  // Handle selection changes
  const handleValueChange = (value: string, type: CategoryType, path?: TreeSelectPath) => {
    if (multiSelect) {
      // For multi-select, toggle the selection
      const newSelection = selectedCategories.includes(value)
        ? selectedCategories.filter(id => id !== value)
        : [...selectedCategories, value];
      onSelect(newSelection);
    } else {
      // For single-select, just use the new value
      onSelect([value]);
    }
  };

  // Use the first selected category as the current value for TreeSelect
  // and update the display label to show all selected categories
  const currentValue = selectedCategories[0] || '';
  const displayLabel = useMemo(() => {
    if (selectedCategories.length === 0) return '';
    if (selectedCategories.length === 1) {
      const category = categories.find(c => c.category_id === selectedCategories[0]);
      if (!category) return '';
      if (category.parent_category) {
        const parent = categories.find(c => c.category_id === category.parent_category);
        return parent ? `${parent.category_name} → ${category.category_name}` : category.category_name;
      }
      return category.category_name;
    }
    return `${selectedCategories.length} categories selected`;
  }, [selectedCategories, categories]);

  return (
    <TreeSelect
      options={treeOptions}
      value={currentValue}
      onValueChange={handleValueChange}
      placeholder={displayLabel || placeholder}
      className={className}
      selectedClassName="bg-gray-100"
      hoverClassName="hover:bg-gray-100"
      triggerClassName="hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      contentClassName="bg-white rounded-md shadow-lg border border-gray-200"
    />
  );
};

export default CategoryPicker;
