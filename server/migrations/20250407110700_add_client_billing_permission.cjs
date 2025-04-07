/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Get all tenants
  const tenants = await knex('tenants').select('tenant');
  if (!tenants.length) return;

  // For each tenant, add the permissions and update roles
  for (const { tenant } of tenants) {
    // Get existing permissions to avoid duplicates
    const existingPerms = await knex('permissions')
      .where({ tenant, resource: 'client_billing' })
      .select('resource', 'action');

    const existingMap = new Set(existingPerms.map(p => `${p.resource}:${p.action}`));

    // Define new client_billing permissions
    const permissionsToAdd = [
      { resource: 'client_billing', action: 'read' }
    ].filter(p => !existingMap.has(`${p.resource}:${p.action}`))
     .map(p => ({
       tenant,
       permission_id: knex.raw('gen_random_uuid()'),
       ...p
     }));

    if (permissionsToAdd.length > 0) {
      await knex('permissions').insert(permissionsToAdd);
    }

    // Get client_admin role
    const clientAdminRole = await knex('roles')
      .where({ tenant, role_name: 'client_admin' })
      .first();

    if (clientAdminRole) {
      // Get the client_billing permission
      const clientBillingPerm = await knex('permissions')
        .where({ 
          tenant, 
          resource: 'client_billing',
          action: 'read'
        })
        .first();

      if (clientBillingPerm) {
        // Check if role permission already exists
        const existingRolePerm = await knex('role_permissions')
          .where({
            tenant,
            role_id: clientAdminRole.role_id,
            permission_id: clientBillingPerm.permission_id
          })
          .first();

        // Assign permission to client_admin role if not already assigned
        if (!existingRolePerm) {
          await knex('role_permissions').insert({
            tenant,
            role_id: clientAdminRole.role_id,
            permission_id: clientBillingPerm.permission_id
          });
        }
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Get all tenants
  const tenants = await knex('tenants').select('tenant');
  if (!tenants.length) return;

  for (const { tenant } of tenants) {
    // Get permission IDs
    const permissions = await knex('permissions')
      .where({ 
        tenant, 
        resource: 'client_billing',
        action: 'read'
      });

    if (permissions.length > 0) {
      const permissionIds = permissions.map(p => p.permission_id);

      // Remove role permissions
      await knex('role_permissions')
        .where('tenant', tenant)
        .whereIn('permission_id', permissionIds)
        .delete();

      // Remove permissions
      await knex('permissions')
        .where({ 
          tenant, 
          resource: 'client_billing',
          action: 'read'
        })
        .delete();
    }
  }
};