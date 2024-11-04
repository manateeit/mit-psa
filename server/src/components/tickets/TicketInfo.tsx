// server/src/components/tickets/TicketInfo.tsx
import React from 'react';
import { ITicket, IComment } from '@/interfaces';
import EditableField from '@/components/ui/EditableField';
import styles from './TicketDetails.module.css';

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
