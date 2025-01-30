import React from 'react';
import { WorkItemType } from '@/interfaces/workItem.interfaces';

interface WorkItemCardProps {
  ticketNumber?: string;
  priority?: string;
  client?: string;
  subject?: string;
  title?: string;
  description?: string;
  type?: WorkItemType;
  isBillable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const WorkItemCard: React.FC<WorkItemCardProps> = ({ 
  ticketNumber, 
  priority, 
  client, 
  subject,
  title,
  description,
  type,
  isBillable,
  onClick
}) => {
  return (
    <div 
      className="bg-white p-2 rounded shadow cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      {title ? (
        <>
          <div className="font-bold">{title}</div>
          <div className="text-sm">{description}</div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>
              {type === 'ticket' ? 'Ticket' : 
               type === 'ad_hoc' ? 'Ad Hoc Entry' :
               type === 'project_task' ? 'Project Task' :
               type === 'non_billable_category' ? 'Non-Billable' : 
               'Unknown Type'}
            </span>
            <span>{isBillable ? 'Billable' : 'Non-billable'}</span>
          </div>
        </>
      ) : (
        <>
          <div className="font-bold">{ticketNumber}</div>
          <div className="text-sm text-gray-600">{priority}</div>
          <div className="text-sm">{subject}</div>
          {client && <div className="text-xs text-gray-500">{client}</div>}
        </>
      )}
    </div>
  );
};

export default WorkItemCard;
