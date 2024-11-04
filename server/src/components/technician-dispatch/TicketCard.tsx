import React from 'react';
import { WorkItemType } from '@/interfaces/workItem.interfaces';

interface TicketCardProps {
  ticketNumber?: string;
  priority?: string;
  client?: string;
  subject?: string;
  title?: string;
  description?: string;
  type?: WorkItemType;
  isBillable?: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({ 
  ticketNumber, 
  priority, 
  client, 
  subject,
  title,
  description,
  type,
  isBillable
}) => {
  return (
    <div className="bg-white p-2 rounded shadow">
      {title ? (
        <>
          <div className="font-bold">{title}</div>
          <div className="text-sm">{description}</div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{type === 'ticket' ? 'Ticket' : 'Project Task'}</span>
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

export default TicketCard;
