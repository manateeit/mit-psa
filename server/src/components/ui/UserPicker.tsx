// server/src/components/ui/UserPicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import AvatarIcon from 'server/src/components/ui/AvatarIcon';
import { IUserWithRoles } from 'server/src/interfaces/auth.interfaces';
import { ChevronDown, Search } from 'lucide-react';
import { AutomationProps } from '../../types/ui-reflection/types';

interface UserPickerProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'lg';
  users: IUserWithRoles[];
  disabled?: boolean;
}

const UserPicker: React.FC<UserPickerProps & AutomationProps> = ({ label, value, onValueChange, size = 'sm', users, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Filter for internal users only
  const internalUsers = users.filter(user => user.user_type === 'internal');
  
  const currentUser = internalUsers.find(user => user.user_id === value);
  
  // Filter users based on search query
  const filteredUsers = internalUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  const handleSelectUser = (userId: string) => {
    onValueChange(userId === 'unassigned' ? '' : userId);
    setIsOpen(false);
  };

  const selectedUserName = currentUser 
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Unnamed User'
    : 'Not assigned';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {label && <h5 className="font-bold mb-1">{label}</h5>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className="inline-flex items-center justify-between border border-gray-200 rounded-lg p-2 bg-white cursor-pointer min-h-[38px] hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-fit min-w-[150px]"
      >
        <div className="flex items-center gap-2 flex-1">
          {currentUser && (
            <AvatarIcon
              userId={currentUser.user_id}
              firstName={currentUser.first_name || ''}
              lastName={currentUser.last_name || ''}
              size={size === 'sm' ? 'sm' : 'md'}
            />
          )}
          <span>{selectedUserName}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoComplete="off"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          {/* User List */}
          <div className="max-h-[250px] overflow-y-auto p-1">
            {/* Not assigned option */}
            <div
              className="relative flex items-center px-3 py-2 text-sm rounded text-gray-900 cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
              onClick={() => handleSelectUser('unassigned')}
            >
              Not assigned
            </div>
            
            {/* User options */}
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="relative flex items-center px-3 py-2 text-sm rounded text-gray-900 cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                onClick={() => handleSelectUser(user.user_id)}
              >
                <div className="flex items-center gap-2">
                  <AvatarIcon
                    userId={user.user_id}
                    firstName={user.first_name || ''}
                    lastName={user.last_name || ''}
                    size={size === 'sm' ? 'sm' : 'md'}
                  />
                  <span>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}</span>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && searchQuery && (
              <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPicker;
