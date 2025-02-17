exports.seed = async function(knex) {
    // Deletes ALL existing entries
    await knex('permissions').where('resource', 'project').del();
    
    // Inserts seed entries
    await knex('permissions').insert([
      {
        tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        resource: 'project',
        action: 'read'
      },
      {
        tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        resource: 'project',
        action: 'create'
      },
      {
        tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        resource: 'project',
        action: 'update'
      },
      {
        tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        resource: 'project',
        action: 'delete'
      }
    ]);
  
    // Fetch all roles
    const roles = await knex('roles').select('role_id');
  
    // Fetch all project permissions
    const projectPermissions = await knex('permissions')
      .where('resource', 'project')
      .select('permission_id');
  
    // Prepare role_permissions entries
    const rolePermissions = roles.flatMap(role => 
      projectPermissions.map(permission => ({
        tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        role_id: role.role_id,
        permission_id: permission.permission_id
      }))
    );
  
    // Insert role_permissions
    await knex('role_permissions').insert(rolePermissions);
  };
  