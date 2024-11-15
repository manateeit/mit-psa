// server/src/components/ui/UserPicker.tsx
import React from 'react';
import AvatarIcon from '@/components/ui/AvatarIcon';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import CustomSelect from '@/components/ui/CustomSelect';

interface UserPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'lg';
  users: IUserWithRoles[];
}

const UserPicker: React.FC<UserPickerProps> = ({ label, value, onValueChange, size = 'sm', users }) => {
  const currentUser = users.find(user => user.user_id === value);
  
  const options = [
    { value: 'unassigned', label: 'Not assigned' },
    ...users.map((user): { value: string; label: string; } => ({
      value: user.user_id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User',
    }))
  ];

  // Convert empty string to 'unassigned' and vice versa
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === 'unassigned' ? '' : newValue);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 mb-1">
        {currentUser && (
          <AvatarIcon
            userId={currentUser.user_id}
            firstName={currentUser.first_name || ''}
            lastName={currentUser.last_name || ''}
            size={size === 'sm' ? 'sm' : 'md'}
          />
        )}
        <h5 className="font-bold">{label}</h5>
      </div>
      <CustomSelect
        value={value || 'unassigned'}
        onValueChange={handleValueChange}
        options={options}
        placeholder="Select user..."
      />
    </div>
  );
};

export default UserPicker;
