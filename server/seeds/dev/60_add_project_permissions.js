exports.seed = async function(knex) {
    // Deletes ALL existing entries
    await knex('permissions').where('resource', 'project').del();
    
    // Inserts seed entries
    await knex('permissions').insert([
      {
        tenant: '11111111-1111-1111-1111-111111111111',
        resource: 'project',
        action: 'read'
      },
      {
        tenant: '11111111-1111-1111-1111-111111111111',
        resource: 'project',
        action: 'create'
      },
      {
        tenant: '11111111-1111-1111-1111-111111111111',
        resource: 'project',
        action: 'update'
      },
      {
        tenant: '11111111-1111-1111-1111-111111111111',
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
        tenant: '11111111-1111-1111-1111-111111111111',
        role_id: role.role_id,
        permission_id: permission.permission_id
      }))
    );
  
    // Insert role_permissions
    await knex('role_permissions').insert(rolePermissions);
  };
  