'use client';

import { useState, useEffect } from 'react';
import { IProject, IUserWithRoles } from '@/interfaces';
import { Edit2, X } from 'lucide-react';
import AvatarIcon from '@/components/ui/AvatarIcon';
import ProjectActiveToggle from './ProjectActiveToggle';
import BackNav from '@/components/ui/BackNav';
import { Button } from '@/components/ui/Button';
import UserPicker from '@/components/ui/UserPicker';
import CustomSelect from '@/components/ui/CustomSelect';
import { getContactsByCompany, getAllContacts } from '@/lib/actions/contact-actions/contactActions';

interface ProjectInfoProps {
  project: IProject;
  contact?: {
    full_name: string;
  };
  assignedUser?: IUserWithRoles;
  users: IUserWithRoles[];
  onContactChange?: (contactId: string | null) => void;
  onAssignedUserChange?: (userId: string | null) => void;
}

export default function ProjectInfo({
  project,
  contact,
  assignedUser,
  users,
  onContactChange,
  onAssignedUserChange
}: ProjectInfoProps) {
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = project.company_id 
          ? await getContactsByCompany(project.company_id)
          : await getAllContacts();
        setContacts(contactsData.map(contact => ({
          value: contact.contact_name_id,
          label: contact.full_name
        })));
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      }
    };
    fetchContacts();
  }, [project.company_id]);

  const handleSaveUser = () => {
    if (onAssignedUserChange) {
      onAssignedUserChange(selectedUserId);
    }
    setShowUserPicker(false);
  };

  const handleCancelUser = () => {
    setSelectedUserId(null);
    setShowUserPicker(false);
  };

  const handleSaveContact = () => {
    if (onContactChange) {
      onContactChange(selectedContactId);
    }
    setShowContactPicker(false);
  };

  const handleCancelContact = () => {
    setSelectedContactId(null);
    setShowContactPicker(false);
  };

  return (
    <div className="space-y-4 mb-4">
      <div className="flex items-center space-x-5">
        <BackNav href="/msp/projects">Back to Projects</BackNav>
        <h1 className="text-xl font-bold">{project.project_name}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Contact Section */}
          <div className="flex items-center space-x-2">
            <h5 className="font-bold">Contact:</h5>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-blue-500 cursor-pointer hover:underline">
                {contact?.full_name || 'N/A'}
              </p>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setShowContactPicker(!showContactPicker)}
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
            {showContactPicker && (
              <div className="flex items-center space-x-2">
                <CustomSelect
                  value={selectedContactId || project.contact_name_id || ''}
                  onValueChange={setSelectedContactId}
                  options={contacts}
                  placeholder="Select Contact"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelContact}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveContact}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {/* Assigned To Section */}
          <div className="flex items-center space-x-2">
            <h5 className="font-bold">Assigned To:</h5>
            <div className="flex items-center space-x-2">
              {assignedUser ? (
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <AvatarIcon
                    userId={assignedUser.user_id}
                    firstName={assignedUser.first_name || ''}
                    lastName={assignedUser.last_name || ''}
                    size="sm"
                  />
                  <span className="text-sm">
                    {assignedUser.first_name || ''} {assignedUser.last_name || ''}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unassigned</p>
              )}
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setShowUserPicker(!showUserPicker)}
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
            {showUserPicker && (
              <div className="flex items-center space-x-2">
                <UserPicker
                  users={users}
                  value={selectedUserId || assignedUser?.user_id || ''}
                  onValueChange={setSelectedUserId}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelUser}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveUser}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
