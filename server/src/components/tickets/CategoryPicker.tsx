import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';

interface CategoryPickerProps {
  categories: ITicketCategory[];
  selectedCategories: string[];
  onSelect: (categoryIds: string[]) => void;
  placeholder?: string;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onSelect,
  placeholder = 'Select categories...'
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
    // Find the selected category
    const category = categories.find(c => c.category_id === categoryId);
    if (!category) return;

    // If it's a subcategory, include both parent and child
    if (category.parent_category) {
      onSelect([categoryId]);
    } else {
      // If it's a parent category, just select that one
      onSelect([categoryId]);
    }
    
    setIsOpen(false);
  };

  const handleRemoveCategory = (categoryId: string) => {
    onSelect([]);
  };

  return (
    <div className="relative inline-block min-w-[200px]" ref={containerRef}>
      <div 
        className="flex items-center justify-between border rounded-lg p-2 bg-white cursor-pointer min-h-[38px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-2">
          {selectedCategories.length > 0 ? (
            getSelectedCategoryNames().map((name: string, index: number): JSX.Element => (
              <div key={selectedCategories[index]} className="bg-gray-100 rounded-md px-2 py-1 text-sm flex items-center gap-1">
                {name}
                <X 
                  className="w-4 h-4 cursor-pointer hover:text-gray-600" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCategory(selectedCategories[index]);
                  }}
                />
              </div>
            ))
          ) : (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''} ml-2`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-[300px] mt-1 bg-white border rounded-md shadow-lg">
          <div className="p-2">
            <div className="flex items-center border rounded px-2 py-1 mb-2">
              <input
                type="text"
                className="outline-none flex-1 text-sm"
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
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => {
                      if (categoryMap.has(parent.category_id)) {
                        setActiveParent(activeParent === parent.category_id ? null : parent.category_id);
                      } else {
                        handleCategorySelect(parent.category_id);
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
                      <span className="text-sm">{parent.category_name}</span>
                    </div>
                    {categoryMap.has(parent.category_id) && (
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          activeParent === parent.category_id ? 'transform rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>
                  {activeParent === parent.category_id && categoryMap.get(parent.category_id)?.map((child: ITicketCategory): JSX.Element => (
                    <div
                      key={child.category_id}
                      className="flex items-center px-6 py-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => handleCategorySelect(child.category_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(child.category_id)}
                        onChange={() => handleCategorySelect(child.category_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2 rounded border-gray-300"
                      />
                      <span className="text-sm">{child.category_name}</span>
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
