// server/src/components/ui/UserPicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import AvatarIcon from './AvatarIcon';
import CustomSelect from './CustomSelect';
import { IUser, IUserWithRoles } from '@/interfaces/auth.interfaces';

interface UserPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'lg';
  users: IUserWithRoles[];
}

interface UserOption {
  value: string;
  label: string;
}

const UserPicker: React.FC<UserPickerProps> = ({ label, value, onValueChange, size = 'sm', users }) => {
  const [isEditing, setIsEditing] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentUser = users.find(user => user.user_id === value);

  const options: UserOption[] = users.map((user): UserOption => ({
    value: user.user_id,
    label: `${user.first_name || ''} ${user.last_name || ''}`,
  }));

  const sizeClasses = {
    sm: 'text-sm',
    lg: 'text-base',
  };

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
    setIsEditing(false);
  };

  return (
    <div className="relative" ref={fieldRef}>
      <h5 className="font-bold">{label}</h5>
      {isEditing ? (
        <CustomSelect
          value={value}
          onValueChange={handleValueChange}
          options={options}
          customStyles={{
            trigger: "inline-flex items-center justify-between rounded px-3 py-2 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
            content: "bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-auto",
            item: "text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white",
            itemIndicator: "absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600",
          }}
        />
      ) : (
        <div
          className={`flex items-center space-x-2 cursor-pointer ${sizeClasses[size]}`}
          onClick={() => {
            setIsEditing(true);
          }}
        >
          <AvatarIcon
            userId={currentUser?.user_id || ''}
            firstName={currentUser?.first_name || ''}
            lastName={currentUser?.last_name || ''}
            size={size === 'sm' ? 'sm' : 'md'}
          />
          <span className="hover:bg-gray-100 rounded px-[2px] py-[3px] transition-colors duration-200">
            {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}` : 'Not set'}
          </span>
        </div>
      )}
    </div>
  );
};

export default UserPicker;
