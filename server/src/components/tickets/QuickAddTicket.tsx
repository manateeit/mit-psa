'use client'

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/Button';
import { X, AlertCircle } from 'lucide-react';
import { addTicket } from '@/lib/actions/ticket-actions/ticketActions';
import { getAllUsers, getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getAllChannels } from '@/lib/actions/channel-actions/channelActions';
import { getTicketStatuses } from '@/lib/actions/status-actions/statusActions';
import { getAllPriorities } from '@/lib/actions/priorityActions';
import { getAllCompanies, getCompanyById } from '@/lib/actions/companyActions';
import { getContactsByCompany } from '@/lib/actions/contact-actions/contactActions';
import { IUser, IChannel, ITicketStatus, IPriority, ICompany, IContact, ITicket } from '@/interfaces';
import { ChannelPicker } from '@/components/settings/general/ChannelPicker';
import { CompanyPicker } from '../companies/CompanyPicker';
import { useSession } from 'next-auth/react';

interface QuickAddTicketProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTicketAdded: (ticket: ITicket) => void;
    prefilledCompany?: {
        id: string;
        name: string;
    };
    prefilledContact?: {
        id: string;
        name: string;
    };
    prefilledDescription?: string;
}

export function QuickAddTicket({ open, onOpenChange, onTicketAdded, prefilledCompany, prefilledContact, prefilledDescription }: QuickAddTicketProps) {
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(prefilledDescription || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [channelId, setChannelId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [priorityId, setPriorityId] = useState('');
    const [companyId, setCompanyId] = useState(prefilledCompany?.id || '');
    const [contactId, setContactId] = useState(prefilledContact?.id || null);
    const [companyFilterState, setCompanyFilterState] = useState<'all' | 'active' | 'inactive'>('all');
    const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'company' | 'individual'>('all');
    const [selectedCompanyType, setSelectedCompanyType] = useState<'company' | 'individual' | null>(null);

    const [users, setUsers] = useState<IUser[]>([]);
    const [channels, setChannels] = useState<IChannel[]>([]);
    const [statuses, setStatuses] = useState<ITicketStatus[]>([]);
    const [priorities, setPriorities] = useState<IPriority[]>([]);
    const [companies, setCompanies] = useState<ICompany[]>([]);
    const [contacts, setContacts] = useState<IContact[]>([]);
    const [isPrefilledCompany, setIsPrefilledCompany] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, channelsData, statusesData, prioritiesData, companiesData] = await Promise.all([
                    getAllUsers(),
                    getAllChannels(),
                    getTicketStatuses(),
                    getAllPriorities(),
                    getAllCompanies(false)
                ]);
                setUsers(usersData);
                setChannels(channelsData);
                setPriorities(prioritiesData);
                setCompanies(companiesData);

                if (Array.isArray(statusesData) && statusesData.length > 0) {
                    setStatuses(statusesData);
                } else {
                    console.error('No ticket statuses fetched:', statusesData);
                    setStatuses([]);
                }

                if (prefilledCompany) {
                    setIsPrefilledCompany(true);
                    const company = await getCompanyById(prefilledCompany.id);
                    if (company) {
                        setCompanyId(company.company_id);
                        setSelectedCompanyType(company.client_type as 'company' | 'individual');
                        if (company.client_type === 'company') {
                            const contactsData = await getContactsByCompany(company.company_id);
                            setContacts(contactsData);
                        }
                    }
                }

                if (prefilledContact) {
                    setContactId(prefilledContact.id);
                }

                if (prefilledDescription) {
                    setDescription(prefilledDescription);
                }
            } catch (error) {
                setError('Failed to load form data. Please try again.');
                console.error('Error fetching form data:', error);
            }
        };
        fetchData();
    }, [prefilledCompany, prefilledContact, prefilledDescription]);

    useEffect(() => {
        const fetchContacts = async () => {
            if (companyId && !isPrefilledCompany) {
                try {
                    const contactsData = await getContactsByCompany(companyId);
                    setContacts(contactsData);
                } catch (error) {
                    console.error('Error fetching contacts:', error);
                    setContacts([]);
                    setError('Failed to load contacts. Please try again.');
                }
            } else if (!isPrefilledCompany) {
                setContacts([]);
            }
        };
        fetchContacts();
    }, [companyId, isPrefilledCompany]);

    const handleCompanyChange = async (newCompanyId: string) => {
        if (isPrefilledCompany) return;

        setCompanyId(newCompanyId);
        setContactId(null);
        setError(null); // Clear any existing errors
    
        if (newCompanyId) {
            const selectedCompany = companies.find(company => company.company_id === newCompanyId);
            
            if (selectedCompany?.client_type === 'company') {
                setSelectedCompanyType('company');
            } else if (selectedCompany?.client_type === 'individual') {
                setSelectedCompanyType('individual');
            } else {
                setSelectedCompanyType(null);
            }
        } else {
            setSelectedCompanyType(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear any existing errors

        try {
            if (!session?.user?.id) {
                throw new Error('You must be logged in to create a ticket');
            }

            const user = await getCurrentUser();
            if (!user) {
                throw new Error('Failed to get user information');
            }

            // Validate required fields
            if (!title.trim()) throw new Error('Title is required');
            if (!description.trim()) throw new Error('Description is required');
            if (!assignedTo) throw new Error('Please assign the ticket to someone');
            if (!channelId) throw new Error('Please select a channel');
            if (!statusId) throw new Error('Please select a status');
            if (!priorityId) throw new Error('Please select a priority');
            if (!companyId) throw new Error('Please select a company');
            if (selectedCompanyType === 'company' && !contactId) {
                throw new Error('Please select a contact for the company');
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('assigned_to', assignedTo);
            formData.append('channel_id', channelId);
            formData.append('status_id', statusId);
            formData.append('priority_id', priorityId);
            formData.append('company_id', companyId);
            
            if (selectedCompanyType === 'company' && contactId) {
                formData.append('contact_name_id', contactId);
            }

            const newTicket = await addTicket(formData, user);
            if (newTicket) {
                onTicketAdded(newTicket);
                onOpenChange(false);
                // Clear form fields
                setTitle('');
                setDescription('');
                setAssignedTo('');
                setChannelId('');
                setStatusId('');
                setPriorityId('');
                setCompanyId('');
                setContactId(null);
                setSelectedCompanyType(null);
                setError(null);
            } else {
                throw new Error('Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            setError(error instanceof Error ? error.message : 'Failed to create ticket. Please try again.');
        }
    };

    const filteredCompanies = companies.filter(company => {
        if (companyFilterState === 'all') return true;
        if (companyFilterState === 'active') return !company.is_inactive;
        if (companyFilterState === 'inactive') return company.is_inactive;
        return true;
    });

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto animate-scale-in">
                    <Dialog.Title className="text-xl font-bold mb-4">Quick Add Ticket</Dialog.Title>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ticket Title"
                            className="w-full p-2 border rounded"
                            required
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full p-2 border rounded"
                            required
                        />

                        <CompanyPicker
                            companies={filteredCompanies}
                            onSelect={handleCompanyChange}
                            selectedCompanyId={companyId}
                            filterState={companyFilterState}
                            onFilterStateChange={setCompanyFilterState}
                            clientTypeFilter={clientTypeFilter}
                            onClientTypeFilterChange={setClientTypeFilter}
                        />

                        {selectedCompanyType === 'company' && contacts.length > 0 && (
                            <select
                                value={contactId || ''}
                                onChange={(e) => setContactId(e.target.value || null)}
                                className="w-full p-2 border rounded"
                                required={selectedCompanyType === 'company'}
                                disabled={!companyId || selectedCompanyType !== 'company'}
                            >
                                <option value="">Select Contact</option>
                                {contacts.map((contact):JSX.Element => (
                                    <option key={contact.contact_name_id} value={contact.contact_name_id}>
                                        {contact.full_name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Assign To</option>
                            {users.map((user):JSX.Element => (
                                <option key={user.user_id} value={user.user_id}>
                                    {user.first_name} {user.last_name}
                                </option>
                            ))}
                        </select>
                        
                        <ChannelPicker
                            channels={channels}
                            onSelect={(channelId) => setChannelId(channelId)}
                            selectedChannelId={channelId}
                            onFilterStateChange={() => {}}
                            filterState="all"
                        />

                        <select
                            value={statusId}
                            onChange={(e) => setStatusId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Select Status</option>
                            {statuses.length > 0 ? (
                                statuses.map((status):JSX.Element => (
                                    <option key={status.status_id} value={status.status_id}>
                                        {status.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>No statuses available</option>
                            )}
                        </select>
                        <select
                            value={priorityId}
                            onChange={(e) => setPriorityId(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Select Priority</option>
                            {priorities.map((priority):JSX.Element => (
                                <option key={priority.priority_id} value={priority.priority_id}>
                                    {priority.priority_name}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Dialog.Close asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </Dialog.Close>
                            <Button type="submit" variant="default">Save Ticket</Button>
                        </div>
                    </form>
                    <Dialog.Close asChild>
                        <Button 
                            variant="default"
                            size="sm"
                            className="absolute top-4 right-4 p-0 rounded-full w-10 h-10 flex items-center justify-center" 
                            aria-label="Close"
                        >
                            <X className="h-8 w-8" />
                        </Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
