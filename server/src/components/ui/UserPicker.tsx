// server/src/components/ui/UserPicker.tsx
import React from 'react';
import AvatarIcon from '@/components/ui/AvatarIcon';
import { IUser, IUserWithRoles } from '@/interfaces/auth.interfaces';
import { Select } from '@/components/ui/Select';

interface UserPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'lg';
  users: IUserWithRoles[];
}

const UserPicker: React.FC<UserPickerProps> = ({ label, value, onValueChange, size = 'sm', users }) => {
  const currentUser = users.find(user => user.user_id === value);
  
  const options = users.map(user => ({
    value: user.user_id,
    label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User',
  }));

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 mb-1">
        <AvatarIcon
          userId={currentUser?.user_id || ''}
          firstName={currentUser?.first_name || ''}
          lastName={currentUser?.last_name || ''}
          size={size === 'sm' ? 'sm' : 'md'}
        />
        <h5 className="font-bold">{label}</h5>
      </div>
      <Select
        value={value}
        onChange={onValueChange}
        options={options}
        placeholder="Select user..."
      />
    </div>
  );
};

export default UserPicker;
