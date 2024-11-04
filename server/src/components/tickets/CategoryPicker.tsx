import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';

interface CategoryPickerProps {
  categories: ITicketCategory[];
  selectedCategories: string[];
  onSelect: (categoryIds: string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  className?: string;
  containerClassName?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onSelect,
  placeholder = 'Select categories...',
  multiSelect = false,
  className = '',
  containerClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Organize categories into parent-child structure
  const parentCategories = categories.filter(c => !c.parent_category);
  const childCategories = categories.filter(c => c.parent_category);
  const categoryMap = new Map<string, ITicketCategory[]>();
  
  childCategories.forEach((child: ITicketCategory): void => {
    if (!categoryMap.has(child.parent_category!)) {
      categoryMap.set(child.parent_category!, []);
    }
    categoryMap.get(child.parent_category!)?.push(child);
  });

  // Filter categories based on search query
  const filterCategories = (query: string) => {
    if (!query) return parentCategories;

    const lowercaseQuery = query.toLowerCase();
    const matchingParents = parentCategories.filter((parent: ITicketCategory): boolean =>
      parent.category_name.toLowerCase().includes(lowercaseQuery)
    );

    const matchingChildren = childCategories.filter(child =>
      child.category_name.toLowerCase().includes(lowercaseQuery)
    );

    // Include parents of matching children
    const parentsOfMatches = new Set(matchingChildren.map((child: ITicketCategory): string => child.parent_category!));
    const additionalParents = parentCategories.filter(parent =>
      parentsOfMatches.has(parent.category_id)
    );

    return [...new Set([...matchingParents, ...additionalParents])];
  };

  const getSelectedCategoryNames = () => {
    return selectedCategories.map((categoryId: string): string => {
      const category = categories.find(c => c.category_id === categoryId);
      if (!category) return '';
      
      if (category.parent_category) {
        const parent = categories.find(c => c.category_id === category.parent_category);
        return parent ? `${parent.category_name} → ${category.category_name}` : category.category_name;
      }
      return category.category_name;
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.category_id === categoryId);
    if (!category) return;

    if (multiSelect) {
      // For filtering: allow multiple selections
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
      onSelect(newSelection);
    } else {
      // For ticket assignment: single selection
      onSelect([categoryId]);
      setIsOpen(false);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    if (multiSelect) {
      onSelect(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelect([]);
    }
  };

  return (
    <div className={`relative ${containerClassName}`} ref={containerRef}>
      <button 
        type="button"
        className={`flex items-center justify-between border border-gray-300 rounded-md shadow-sm bg-white cursor-pointer min-h-[38px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-2 min-h-[20px]">
          {selectedCategories.length > 0 ? (
            getSelectedCategoryNames().map((name: string, index: number): JSX.Element => (
              <div key={selectedCategories[index]} className="bg-gray-50 rounded px-2 py-1 text-gray-700 flex items-center gap-1">
                {name}
                <X 
                  className="w-4 h-4 cursor-pointer hover:text-gray-900" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCategory(selectedCategories[index]);
                  }}
                />
              </div>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-fit" style={{ minWidth: '100%', maxWidth: 'max-content' }}>
          <div className="p-1">
            <div className="flex items-center border border-gray-300 rounded mb-2 mx-1">
              <input
                type="text"
                className="w-full px-3 py-2 text-gray-700 outline-none"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filterCategories(searchQuery).map((parent: ITicketCategory): JSX.Element => (
                <div key={parent.category_id}>
                  <div
                    className="relative flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none select-none mx-1 whitespace-nowrap"
                    onClick={() => {
                      if (!categoryMap.has(parent.category_id)) {
                        handleCategorySelect(parent.category_id);
                      } else {
                        setActiveParent(activeParent === parent.category_id ? null : parent.category_id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(parent.category_id)}
                        onChange={() => handleCategorySelect(parent.category_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300"
                      />
                      <span>{parent.category_name}</span>
                    </div>
                    {categoryMap.has(parent.category_id) && (
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-400 transition-transform ml-4 ${
                          activeParent === parent.category_id ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                  {activeParent === parent.category_id && categoryMap.get(parent.category_id)?.map((child: ITicketCategory): JSX.Element => (
                    <div
                      key={child.category_id}
                      className="relative flex items-center px-6 py-2 rounded cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none select-none mx-1 whitespace-nowrap"
                      onClick={() => handleCategorySelect(child.category_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(child.category_id)}
                        onChange={() => handleCategorySelect(child.category_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span>{child.category_name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
