'use client'

import React from 'react';
import { IExtendedWorkItem } from '@/interfaces/workItem.interfaces';
import { getTicketById } from '@/lib/actions/ticket-actions/ticketActions';
import { getTaskWithDetails } from '@/lib/actions/project-actions/projectTaskActions';
import { getWorkItemById } from '@/lib/actions/workItemActions';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { toast } from 'react-hot-toast';
import TicketDetails from '@/components/tickets/TicketDetails';
import TaskEdit from '@/components/projects/TaskEdit';
import EntryPopup from '@/components/time-management/EntryPopup';
import { useTenant } from '@/components/TenantProvider';

interface WorkItemDrawerProps {
    workItem: IExtendedWorkItem;
    onClose: () => void;
    onTaskUpdate: (updated: any) => Promise<void>;
    onScheduleUpdate: (updated: any) => Promise<void>;
}

interface ScheduleUpdateData {
    entry_id: string;
    title: string;
    notes: string;
    scheduled_start: Date;
    scheduled_end: Date;
    assigned_user_ids: string[];
    status: string;
}

export function WorkItemDrawer({
    workItem,
    onClose,
    onTaskUpdate,
    onScheduleUpdate
}: WorkItemDrawerProps): JSX.Element {
    const tenant = useTenant();
    if (!tenant) {
        throw new Error('tenant is not defined');
    }

    const [content, setContent] = React.useState<JSX.Element | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const loadContent = React.useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                toast.error('No user session found');
                return null;
            }

            switch(workItem.type) {
                case 'ticket': {
                    const ticketData = await getTicketById(workItem.work_item_id, currentUser);
                    return (
                        <div className="min-w-auto h-full bg-white">
                            <TicketDetails 
                                initialTicket={ticketData}
                            />
                        </div>
                    );
                }

                case 'project_task': {
                    const taskData = await getTaskWithDetails(workItem.work_item_id, currentUser);
                    return (
                        <div className="min-w-auto h-full bg-white">
                            <TaskEdit
                                task={taskData}
                                phase={{
                                    phase_id: taskData.phase_id,
                                    project_id: taskData.project_id || '',
                                    phase_name: taskData.phase_name || '',
                                    description: null,
                                    start_date: null,
                                    end_date: null,
                                    status: taskData.status_id || '',
                                    order_number: 0,
                                    created_at: new Date(),
                                    updated_at: new Date(),
                                    wbs_code: taskData.wbs_code,
                                    tenant: tenant
                                }}
                                users={taskData.resources.map((resource: {
                                    assignment_id: string;
                                    task_id: string;
                                    assigned_to: string | null;
                                    additional_user_id: string;
                                    role: string | null;
                                    first_name: string;
                                    last_name: string;
                                    tenant: string;
                                }) => ({
                                    user_id: resource.additional_user_id,
                                    first_name: resource.first_name,
                                    last_name: resource.last_name,
                                    email: '',
                                    username: '',
                                    user_type: 'user',
                                    roles: [],
                                    tenant: resource.tenant,
                                    hashed_password: '',
                                    is_inactive: false
                                }))}
                                onClose={onClose}
                                onTaskUpdated={onTaskUpdate}
                            />
                        </div>
                    );
                }

                case 'ad_hoc': {
                    const adHocData = await getWorkItemById(workItem.work_item_id, 'ad_hoc');
                    if (!adHocData) {
                        toast.error('Failed to load ad-hoc entry data');
                        return null;
                    }

                    return (
                        <div className="min-w-auto h-full bg-white">
                            <EntryPopup
                                slot={null}
                                canAssignMultipleAgents={false}
                                users={[]}
                                event={{
                                    entry_id: adHocData.work_item_id,
                                    work_item_id: adHocData.work_item_id,
                                    work_item_type: adHocData.type,
                                    title: adHocData.name,
                                    notes: adHocData.description,
                                    scheduled_start: new Date(adHocData.scheduled_start || new Date()),
                                    scheduled_end: new Date(adHocData.scheduled_end || new Date()),
                                    status: 'SCHEDULED',
                                    assigned_user_ids: workItem.users?.map(u => u.user_id) || [],
                                    created_at: new Date(),
                                    updated_at: new Date()
                                }}
                                onClose={onClose}
                                onSave={onScheduleUpdate}
                                isInDrawer={true}
                            />
                        </div>
                    );
                }

                default:
                    return (
                        <div className="min-w-auto h-full bg-white p-4">
                            <div>Unsupported work item type</div>
                        </div>
                    );
            }
        } catch (error) {
            console.error('Error loading content:', error);
            return (
                <div className="min-w-auto h-full bg-white p-4">
                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                        <div className="text-lg mb-2">Error loading content</div>
                        <div className="text-sm">Please try again</div>
                    </div>
                </div>
            );
        }
    }, [workItem, tenant, onClose, onTaskUpdate, onScheduleUpdate]);

    React.useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            const loadedContent = await loadContent();
            setContent(loadedContent);
            setIsLoading(false);
        };
        init();
    }, [loadContent]); 

    return (
        <div className="min-w-auto h-full bg-white">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : content}
        </div>
    );
}
