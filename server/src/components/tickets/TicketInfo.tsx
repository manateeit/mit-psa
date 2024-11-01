// server/src/components/tickets/TicketInfo.tsx
import React, { useEffect, useState } from 'react';
import { ITicket, IComment, ITicketCategory } from '@/interfaces';
import EditableField from '@/components/ui/EditableField';
import styles from './TicketDetails.module.css';
import { getTicketCategories } from '@/lib/actions/ticketCategoryActions';

interface TicketInfoProps {
  ticket: ITicket;
  conversations: IComment[];
  statusOptions: { value: string; label: string }[];
  agentOptions: { value: string; label: string }[];
  channelOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  onSelectChange: (field: keyof ITicket, newValue: string) => void;
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
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [categories, setCategories] = useState<ITicketCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getTicketCategories();
        setCategories(fetchedCategories);

        // Create a map of parent categories to their subcategories
        const categoryMap = new Map<string, ITicketCategory[]>();
        const topLevelCategories: ITicketCategory[] = [];

        // First, separate top-level categories and build subcategory map
        fetchedCategories.forEach(category => {
          if (!category.parent_category) {
            topLevelCategories.push(category);
          } else {
            if (!categoryMap.has(category.parent_category)) {
              categoryMap.set(category.parent_category, []);
            }
            categoryMap.get(category.parent_category)?.push(category);
          }
        });

        // Build options array with proper hierarchy
        const options: { value: string; label: string }[] = [
          { value: 'none', label: 'No Category' } // Use 'none' instead of empty string
        ];

        // Add top-level categories and their subcategories
        topLevelCategories.forEach(category => {
          options.push({
            value: category.category_id,
            label: category.category_name
          });

          // Add subcategories with indentation
          const subcategories = categoryMap.get(category.category_id) || [];
          subcategories.forEach(subcategory => {
            options.push({
              value: subcategory.category_id,
              label: `↳ ${subcategory.category_name}`
            });
          });
        });

        setCategoryOptions(options);
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
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'none') {
      // Handle "No Category" selection
      onSelectChange('category_id', '');
    } else {
      const categoryChannel = getCategoryChannel(categoryId);
      if (categoryChannel && categoryChannel !== ticket.channel_id) {
        // If category's channel differs from current ticket channel, update both
        onSelectChange('channel_id', categoryChannel);
      }
      onSelectChange('category_id', categoryId);
    }
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
          <EditableField
            label="Category"
            value={ticket.category_id || 'none'} // Use 'none' for empty value
            options={categoryOptions}
            onValueChange={handleCategoryChange}
          />
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
