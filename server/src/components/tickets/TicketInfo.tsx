// server/src/components/tickets/TicketInfo.tsx
import React, { useEffect, useState } from 'react';
import { ITicket, IComment, ITicketCategory } from '@/interfaces';
import EditableField from '@/components/ui/EditableField';
import { CategoryPicker } from './CategoryPicker';
import styles from './TicketDetails.module.css';
import { getTicketCategories } from '@/lib/actions/ticketCategoryActions';

interface TicketInfoProps {
  ticket: ITicket;
  conversations: IComment[];
  statusOptions: { value: string; label: string }[];
  agentOptions: { value: string; label: string }[];
  channelOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  onSelectChange: (field: keyof ITicket, newValue: string | null) => void;
}

const TicketInfo: React.FC<TicketInfoProps> = ({
  ticket,
  conversations,
  statusOptions,
  agentOptions,
  channelOptions,
  priorityOptions,
  onSelectChange,
}) => {
  const [categories, setCategories] = useState<ITicketCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getTicketCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Helper function to get category channel
  const getCategoryChannel = (categoryId: string): string | undefined => {
    const category = categories.find(c => c.category_id === categoryId);
    return category?.channel_id;
  };

  // Handle category change with channel sync
  const handleCategoryChange = (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      // If no category selected, clear both category and subcategory
      onSelectChange('category_id', null);
      onSelectChange('subcategory_id', null);
      return;
    }

    const selectedCategoryId = categoryIds[0];
    const selectedCategory = categories.find(c => c.category_id === selectedCategoryId);
    
    if (!selectedCategory) {
      console.error('Selected category not found');
      return;
    }

    if (selectedCategory.parent_category) {
      // If it's a subcategory, set both parent and subcategory
      onSelectChange('category_id', selectedCategory.parent_category);
      onSelectChange('subcategory_id', selectedCategoryId);
    } else {
      // If it's a parent category, set only category_id and clear subcategory
      onSelectChange('category_id', selectedCategoryId);
      onSelectChange('subcategory_id', null);
    }

    // Update channel if the selected category has one
    if (selectedCategory.channel_id && selectedCategory.channel_id !== ticket.channel_id) {
      onSelectChange('channel_id', selectedCategory.channel_id);
    }
  };

  // Get the currently selected category ID based on whether we have a subcategory
  const getSelectedCategoryId = () => {
    if (ticket.subcategory_id) {
      return ticket.subcategory_id;
    }
    return ticket.category_id || '';
  };

  return (
    <div className={`${styles['card']}`}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{ticket.title}</h1>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <EditableField
            label="Status"
            value={ticket.status_id || ''}
            options={statusOptions}
            onValueChange={(value) => onSelectChange('status_id', value)}
          />
          <EditableField
            label="Assigned To"
            value={ticket.assigned_to || ''}
            options={agentOptions}
            onValueChange={(value) => onSelectChange('assigned_to', value)}
          />
          <EditableField
            label="Channel"
            value={ticket.channel_id || ''}
            options={channelOptions}
            onValueChange={(value) => onSelectChange('channel_id', value)}
          />
          <EditableField
            label="Priority"
            value={ticket.priority_id || ''}
            options={priorityOptions}
            onValueChange={(value) => onSelectChange('priority_id', value)}
          />
          <div className="w-fit">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <CategoryPicker
                categories={categories}
                selectedCategories={[getSelectedCategoryId()]}
                onSelect={handleCategoryChange}
                placeholder="Select a category..."
              />
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <p>
            {conversations.find(conv => conv.is_initial_description)?.note || 'No initial description found.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketInfo;
