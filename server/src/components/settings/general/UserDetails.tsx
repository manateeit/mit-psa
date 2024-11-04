'use client';
import React, { useState, useEffect } from 'react';
import { IUser, IUserWithRoles, IRole } from '@/interfaces/auth.interfaces';
import { findUserById, updateUser } from '@/lib/actions/user-actions/userActions';
import { getRoles, getUserRoles, assignRoleToUser, removeRoleFromUser } from '@/lib/actions/policyActions';
import { useDrawer } from '@/context/DrawerContext';
import { Text, Flex } from '@radix-ui/themes';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SwitchWithLabel } from '@/components/ui/SwitchWithLabel';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';

interface UserDetailsProps {
  userId: string;
  onUpdate: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<IUserWithRoles | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<IRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { closeDrawer } = useDrawer();

  useEffect(() => {
    fetchUserDetails();
    fetchAvailableRoles();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUser = await findUserById(userId);
      if (fetchedUser) {
        const userRoles = await getUserRoles(userId);
        const userWithRoles: IUserWithRoles = { ...fetchedUser, roles: userRoles };
        setUser(userWithRoles);
        setFirstName(userWithRoles.first_name || '');
        setLastName(userWithRoles.last_name || '');
        setEmail(userWithRoles.email);
        setIsActive(!userWithRoles.is_inactive);
        setRoles(userRoles);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const allRoles = await getRoles();
      setAvailableRoles(allRoles);
    } catch (err) {
      console.error('Error fetching available roles:', err);
      setError('Failed to load available roles.');
    }
  };

  const handleAddRole = async () => {
    if (!user || !selectedRole) return;

    try {
      await assignRoleToUser(user.user_id, selectedRole);
      const updatedRoles = await getUserRoles(user.user_id);
      setRoles(updatedRoles);
      setSelectedRole('');
    } catch (err) {
      console.error('Error adding role:', err);
      setError('Failed to add role. Please try again.');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!user) return;

    try {
      await removeRoleFromUser(user.user_id, roleId);
      const updatedRoles = await getUserRoles(user.user_id);
      setRoles(updatedRoles);
    } catch (err) {
      console.error('Error removing role:', err);
      setError('Failed to remove role. Please try again.');
    }
  };

  const handleSave = async () => {
    if (user) {
      try {
        const updatedUserData: Partial<IUser> = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          is_inactive: !isActive,
        };
        
        const updatedUser = await updateUser(user.user_id, updatedUserData);
        if (updatedUser) {
          setUser(updatedUser);
          onUpdate();
          closeDrawer();
        } else {
          setError('Failed to update user. User not found.');
        }
      } catch (err) {
        console.error('Error updating user:', err);
        setError('Failed to update user. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Text size="2">Loading user details...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <Text size="2" color="red">Error: {error}</Text>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-6">
        <Text size="2">No user found</Text>
      </Card>
    );
  }

  const availableRoleOptions = availableRoles
    .filter((role: IRole): boolean => !roles.some(userRole => userRole.role_id === role.role_id))
    .map((role: IRole): { value: string; label: string } => ({
      value: role.role_id,
      label: role.role_name
    }));

  return (
    <Card className="space-y-6 p-6">
      <Text size="5" weight="bold" className="mb-6">User Details</Text>
      
      <Flex direction="column" gap="4">
        <div>
          <Text as="label" size="2" weight="medium" className="mb-2 block">
            First Name
          </Text>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            className="w-full"
          />
        </div>

        <div>
          <Text as="label" size="2" weight="medium" className="mb-2 block">
            Last Name
          </Text>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            className="w-full"
          />
        </div>

        <div>
          <Text as="label" size="2" weight="medium" className="mb-2 block">
            Email
          </Text>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            className="w-full"
          />
        </div>

        <div>
          <Text as="label" size="2" weight="medium" className="mb-2 block">
            Roles
          </Text>
          <div className="space-y-2">
            {roles.map((role: IRole): JSX.Element => (
              <div key={role.role_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <Text size="2">{role.role_name}</Text>
                <Button
                  variant="ghost"
                  onClick={() => handleRemoveRole(role.role_id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Select
              options={availableRoleOptions}
              value={selectedRole}
              onChange={setSelectedRole}
              className="flex-1"
              placeholder="Select role to add"
            />
            <Button
              onClick={handleAddRole}
              variant="outline"
              disabled={!selectedRole}
            >
              Add Role
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <SwitchWithLabel
            checked={!isActive}
            onCheckedChange={(checked) => setIsActive(!checked)}
            label={isActive ? 'Active' : 'Inactive'}
          />
        </div>
      </Flex>

      <Flex gap="3" mt="6">
        <Button
          onClick={closeDrawer}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="default"
          className="flex-1"
        >
          Save Changes
        </Button>
      </Flex>
    </Card>
  );
};

export default UserDetails;
