'use client';

import { useState, useEffect } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import { Button } from '@/components/ui/Button';
import { assignRoleToUser, removeRoleFromUser, getRoles, getUserRoles } from '@/lib/actions/policyActions';
import { findUserById } from '@/lib/actions/user-actions/userActions';
import { IUser, IRole } from '@/interfaces/auth.interfaces';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import CustomSelect from '@/components/ui/CustomSelect';

export default function UserRoleAssignment() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userRoles, setUserRoles] = useState<{ [key: string]: IRole[] }>({});

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    // This is a placeholder. You'll need to implement a method to fetch all users.
    const fetchedUsers = await findUserById('11111111-1111-1111-1111-111111111111');
    if (fetchedUsers) {
      setUsers([fetchedUsers]);
      fetchUserRoles(fetchedUsers.user_id);
    }
  };

  const fetchRoles = async () => {
    const fetchedRoles = await getRoles();
    setRoles(fetchedRoles);
  };

  const fetchUserRoles = async (userId: string) => {
    const fetchedUserRoles = await getUserRoles(userId);
    setUserRoles(prevUserRoles => ({ ...prevUserRoles, [userId]: fetchedUserRoles }));
  };

  const handleAssignRole = async () => {
    if (selectedUser && selectedRole) {
      await assignRoleToUser(selectedUser, selectedRole);
      fetchUserRoles(selectedUser);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    await removeRoleFromUser(userId, roleId);
    fetchUserRoles(userId);
  };

  const columns: ColumnDefinition<IUser>[] = [
    {
      title: 'User',
      dataIndex: 'username',
    },
    {
      title: 'Roles',
      dataIndex: 'user_id',
      render: (_, record) => userRoles[record.user_id]?.map((role): string => role.role_name).join(', '),
    },
    {
      title: 'Actions',
      dataIndex: 'user_id',
      render: (userId) => (
        <Flex gap="2">
          {userRoles[userId]?.map((role): JSX.Element => (
            <Button key={role.role_id} color="red" onClick={() => handleRemoveRole(userId, role.role_id)}>
              Remove {role.role_name}
            </Button>
          ))}
        </Flex>
      ),
    },
  ];

  const userOptions = users.map((user) => ({
    value: user.user_id,
    label: user.username
  }));

  const roleOptions = roles.map((role) => ({
    value: role.role_id,
    label: role.role_name
  }));

  return (
    <div>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">Assign Roles to Users</Text>
        <Flex gap="2" align="center">
          <div className="relative z-20 inline-block">
            <CustomSelect
              value={selectedUser}
              onValueChange={setSelectedUser}
              options={userOptions}
              placeholder="Select User"
            />
          </div>
          <div className="relative z-10 inline-block">
            <CustomSelect
              value={selectedRole}
              onValueChange={setSelectedRole}
              options={roleOptions}
              placeholder="Select Role"
            />
          </div>
          <Button onClick={handleAssignRole}>Assign Role</Button>
        </Flex>

        <DataTable
          data={users}
          columns={columns}
          pagination={false}
        />
      </Flex>
    </div>
  );
}
