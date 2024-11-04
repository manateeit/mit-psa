'use client';

import { useState, useEffect } from 'react';
import { Select, Flex, Text } from '@radix-ui/themes';
import { Button } from '@/components/ui/Button';
import { assignRoleToUser, removeRoleFromUser, getRoles, getUserRoles } from '@/lib/actions/policyActions';
import { findUserById } from '@/lib/actions/user-actions/userActions';
import { IUser, IRole } from '@/interfaces/auth.interfaces';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

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
      render: (_, record) => userRoles[record.user_id]?.map((role):string => role.role_name).join(', '),
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

  return (
    <div>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">Assign Roles to Users</Text>
        <Flex gap="2">
          <Select.Root value={selectedUser} onValueChange={setSelectedUser}>
            <Select.Trigger placeholder="Select User" />
            <Select.Content>
              {users.map((user):JSX.Element => (
                <Select.Item key={user.user_id} value={user.user_id}>
                  {user.username}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={selectedRole} onValueChange={setSelectedRole}>
            <Select.Trigger placeholder="Select Role" />
            <Select.Content>
              {roles.map((role):JSX.Element => (
                <Select.Item key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
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
