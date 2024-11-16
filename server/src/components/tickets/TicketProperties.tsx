// server/src/components/tickets/TicketProperties.tsx
import React, { useState } from 'react';
import { ITicket, ITimeSheet, ITimePeriod, ITimeEntry } from '@/interfaces';
import { IUserWithRoles, ITeam } from '@/interfaces/auth.interfaces';
import { ITicketResource } from '@/interfaces/ticketResource.interfaces';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Clock, Play, Pause, StopCircle, UserPlus } from 'lucide-react';
import styles from './TicketDetails.module.css';
import UserPicker from '@/components/ui/UserPicker';
import AvatarIcon from '@/components/ui/AvatarIcon';
import { TimeEntryDialog } from '@/components/time-management/TimeEntryDialog';
import { toast } from 'react-hot-toast';

interface TicketPropertiesProps {
  ticket: ITicket;
  company: any;
  contactInfo: any;
  createdByUser: any;
  channel: any;
  elapsedTime: number;
  isRunning: boolean;
  timeDescription: string;
  team: ITeam | null;
  additionalAgents: ITicketResource[];
  availableAgents: IUserWithRoles[];
  currentTimeSheet: ITimeSheet | null;
  currentTimePeriod: ITimePeriod | null;
  userId: string;
  tenant: string;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onTimeDescriptionChange: (value: string) => void;
  onAddTimeEntry: () => void;
  onCompanyClick: () => void;
  onContactClick: () => void;
  onAgentClick: (userId: string) => void;
  onAddAgent: (userId: string) => Promise<void>;
  onRemoveAgent: (assignmentId: string) => Promise<void>;
}

const TicketProperties: React.FC<TicketPropertiesProps> = ({
  ticket,
  company,
  contactInfo,
  createdByUser,
  channel,
  elapsedTime,
  isRunning,
  timeDescription,
  team,
  additionalAgents,
  availableAgents,
  currentTimeSheet,
  currentTimePeriod,
  userId,
  tenant,
  onStart,
  onPause,
  onStop,
  onTimeDescriptionChange,
  onAddTimeEntry,
  onCompanyClick,
  onContactClick,
  onAgentClick,
  onAddAgent,
  onRemoveAgent,
}) => {
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-shrink-0 space-y-6">
      <div className={`${styles['card']} p-6 space-y-4`}>
        <h2 className={`${styles['panel-header']}`}>Time Entry</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Ticket Timer - #{ticket.ticket_number}</span>
            <Clock className="h-6 w-6" />
          </div>
          <div className={`${styles['digital-clock']} text-2xl flex items-center justify-between px-4`}>
            <span>{formatTime(elapsedTime)}</span>
            <div className='pl-5'>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="21" viewBox="0 0 17 21" fill="none">
                <path d="M0.625 20.2V1L15.825 10.2571L0.625 20.2Z" fill="#000" stroke="#000" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
          <div className="flex justify-center space-x-2">
            {!isRunning ? (
              <Button onClick={onStart} className={`w-24`} variant='soft'>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={onPause} className={`w-24`} variant='soft'>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </Button>
            )}
            <Button onClick={onStop} className={`w-24`} variant='soft'>
              <StopCircle className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={timeDescription}
              onChange={(e) => onTimeDescriptionChange(e.target.value)}
              placeholder="Enter work description"
              className={styles['custom-input']}
            />
          </div>
          <Button
            type="button"
            className={`w-full mt-4 flex items-center justify-center`}
            onClick={onAddTimeEntry}
          >
            <span className="mr-2">Add time</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#D6BBFB">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Button>
        </div>
      </div>

      <div className={`${styles['card']} p-6 space-y-4`}>
        <h2 className={`${styles['panel-header']}`}>Contact Info</h2>
        <div className="space-y-2">
          <div>
            <h5 className="font-bold">Contact</h5>
            <p
              className="text-sm text-blue-500 cursor-pointer hover:underline"
              onClick={onContactClick}
            >
              {contactInfo?.full_name || 'N/A'}
            </p>
          </div>
          <div>
            <h5 className="font-bold">Created By</h5>
            <p className="text-sm">
              {createdByUser ? `${createdByUser.first_name} ${createdByUser.last_name}` : 'N/A'}
            </p>
          </div>
          <div>
            <h5 className="font-bold">Client</h5>
            <p
              className="text-sm text-blue-500 cursor-pointer hover:underline"
              onClick={onCompanyClick}
            >
              {company?.company_name || 'N/A'}
            </p>
          </div>
          <div>
            <h5 className="font-bold">{contactInfo ? 'Contact Phone' : 'Company Phone'}</h5>
            <p className="text-sm">{contactInfo?.phone_number || company?.phone_no || 'N/A'}</p>
          </div>
          <div>
            <h5 className="font-bold">{contactInfo ? 'Contact Email' : 'Company Email'}</h5>
            <p className="text-sm">{contactInfo?.email || company?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className={`${styles['card']} p-6 space-y-4`}>
        <h2 className={`${styles['panel-header']}`}>Agent team</h2>
        <div className="space-y-4">
          {/* Primary Agent */}
          <div>
            <h5 className="font-bold mb-2">Primary Agent</h5>
            {ticket.assigned_to ? (
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => onAgentClick(ticket.assigned_to!)}
              >
                <AvatarIcon
                  userId={ticket.assigned_to}
                  firstName={availableAgents.find(a => a.user_id === ticket.assigned_to)?.first_name || ''}
                  lastName={availableAgents.find(a => a.user_id === ticket.assigned_to)?.last_name || ''}
                  size="sm"
                />
                <span className="text-sm">
                  {availableAgents.find(a => a.user_id === ticket.assigned_to)?.first_name || 'Unknown'}{' '}
                  {availableAgents.find(a => a.user_id === ticket.assigned_to)?.last_name || 'Agent'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No primary agent assigned</p>
            )}
          </div>

          {/* Team */}
          <div>
            <h5 className="font-bold mb-2">Team</h5>
            {team ? (
              <div className="text-sm">
                <p>{team.team_name}</p>
                <p className="text-gray-500">
                  Manager: {team.members.find(m => m.user_id === team.manager_id)?.first_name || 'Unknown Manager'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No team assigned</p>
            )}
          </div>

          {/* Additional Agents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold">Additional Agents</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAgentPicker(!showAgentPicker)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {showAgentPicker && (
              <div className="mb-4">
                <UserPicker
                  label="Add Agent"
                  value=""
                  onValueChange={(userId) => {
                    onAddAgent(userId);
                    setShowAgentPicker(false);
                  }}
                  users={availableAgents.filter(
                    agent => !additionalAgents.some(a => a.additional_user_id === agent.user_id)
                  )}
                />
              </div>
            )}

            <div className="space-y-2">
              {additionalAgents.map((agent):JSX.Element => {
                const agentUser = availableAgents.find(u => u.user_id === agent.additional_user_id);
                return (
                  <div 
                    key={agent.assignment_id}
                    className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded"
                  >
                    <div 
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => onAgentClick(agent.additional_user_id!)}
                    >
                      <AvatarIcon
                        userId={agent.additional_user_id!}
                        firstName={agentUser?.first_name || ''}
                        lastName={agentUser?.last_name || ''}
                        size="sm"
                      />
                      <span className="text-sm">
                        {agentUser?.first_name || 'Unknown'} {agentUser?.last_name || 'Agent'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => onRemoveAgent(agent.assignment_id!)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
              {additionalAgents.length === 0 && (
                <p className="text-sm text-gray-500">No additional agents assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketProperties;
