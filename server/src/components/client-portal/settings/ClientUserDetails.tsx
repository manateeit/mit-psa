'use client';

import React, { useState, useEffect } from 'react';
import { IUser } from '@/interfaces/auth.interfaces';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getClientUserById, updateClientUser, resetClientUserPassword } from '@/lib/actions/client-portal-actions/clientUserActions';
import { useDrawer } from '@/context/DrawerContext';
import { Text, Flex } from '@radix-ui/themes';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';

interface ClientUserDetailsProps {
  userId: string;
  onUpdate: () => void;
}

const ClientUserDetails: React.FC<ClientUserDetailsProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { closeDrawer } = useDrawer();

  // Admin password reset states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDetails();
    fetchCurrentUser();
  }, [userId]);

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user) {
        // Check if user has admin role
        const userRoles = user.roles || [];
        setIsAdmin(userRoles.some(role => role.role_name.toLowerCase() === 'admin'));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUser = await getClientUserById(userId);
      if (fetchedUser) {
        setUser(fetchedUser);
        setFirstName(fetchedUser.first_name || '');
        setLastName(fetchedUser.last_name || '');
        setEmail(fetchedUser.email);
        setIsActive(!fetchedUser.is_inactive);
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

  const handleSave = async () => {
    if (user) {
      try {
        const updatedUserData: Partial<IUser> = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          is_inactive: !isActive,
        };
        
        const updatedUser = await updateClientUser(user.user_id, updatedUserData);
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

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (adminNewPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const result = await resetClientUserPassword(userId, adminNewPassword);
      if (result.success) {
        setPasswordSuccess('Password changed successfully');
        setAdminNewPassword('');
      } else {
        setPasswordError(result.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An error occurred while changing password');
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

        <div className="flex items-center justify-between py-3">
          <div>
            <Text size="2" weight="medium">Status</Text>
            <Text size="2" color="gray">Set user account status</Text>
          </div>
          <div className="flex items-center gap-2">
            <Text size="2" color="gray">
              {isActive ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              checked={!isActive}
              onCheckedChange={(checked) => setIsActive(!checked)}
              className="data-[state=checked]:bg-primary-500"
            />
          </div>
        </div>

        {/* Password Reset Section (Admin only) */}
        {isAdmin && (
          <Card className="p-4 mt-4">
            <Text size="3" weight="medium" className="mb-4">Reset User Password</Text>
            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <Text as="label" size="2" weight="medium" className="mb-2 block">
                  New Password
                </Text>
                <div className="relative">
                  <Input
                    type={showAdminNewPassword ? "text" : "password"}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showAdminNewPassword ? (
                      <EyeOpenIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeClosedIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <Button id='reset-password-btn' type="submit" variant="default">
                Reset Password
              </Button>
            </form>
          </Card>
        )}

        {passwordError && (
          <Text size="2" color="red" className="mt-2">
            {passwordError}
          </Text>
        )}

        {passwordSuccess && (
          <Text size="2" color="green" className="mt-2">
            {passwordSuccess}
          </Text>
        )}
      </Flex>

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          id="close-button"
          onClick={closeDrawer}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          id='save-changes-btn'
          onClick={handleSave}
          variant="default"
        >
          Save Changes
        </Button>
      </div>
    </Card>
  );
};

export default ClientUserDetails;
