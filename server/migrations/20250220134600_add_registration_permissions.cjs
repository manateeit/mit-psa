/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Get all tenants
  const tenants = await knex('tenants').select('tenant');
  if (!tenants.length) return;

  // For each tenant, add the permissions and roles
  for (const { tenant } of tenants) {
    // Insert new permissions
    await knex('permissions').insert([
      // Profile permissions
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'profile', action: 'read' },
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'profile', action: 'update' },
      // Asset permissions
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'asset', action: 'read' },
      // Company settings permissions
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'company_setting', action: 'read' },
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'company_setting', action: 'update' },
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'company_setting', action: 'delete' },
      // Client profile permissions
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'client_profile', action: 'read' },
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'client_profile', action: 'update' },
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'client_profile', action: 'delete' },
      // Password management
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'client_password', action: 'update' },
      // Billing permissions
      { tenant, permission_id: knex.raw('gen_random_uuid()'), resource: 'billing', action: 'read' }
    ]).onConflict(['tenant', 'resource', 'action']).ignore();

    // Create client_admin role if it doesn't exist
    await knex('roles').insert({
      tenant,
      role_id: knex.raw('gen_random_uuid()'),
      role_name: 'client_admin',
      description: 'Client administrator role'
    }).onConflict(['tenant', 'role_name']).ignore();

    // Assign base client permissions to client role
    await knex.raw(`
      INSERT INTO role_permissions (tenant, role_id, permission_id)
      SELECT ?, r.role_id, p.permission_id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.tenant = ?
      AND p.tenant = ?
      AND r.role_name = 'client'
      AND (
        -- We already have ticket permissions
        (p.resource = 'project' AND p.action = 'read')
        OR (p.resource = 'profile' AND p.action IN ('read', 'update'))
        OR (p.resource = 'asset' AND p.action = 'read')
      )
      ON CONFLICT (tenant, role_id, permission_id) DO NOTHING
    `, [tenant, tenant, tenant]);

    // Assign admin permissions to client_admin role
    await knex.raw(`
      INSERT INTO role_permissions (tenant, role_id, permission_id)
      SELECT ?, r.role_id, p.permission_id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.tenant = ?
      AND p.tenant = ?
      AND r.role_name = 'client_admin'
      AND (
        -- Base client permissions
        (p.resource = 'project' AND p.action = 'read')
        OR (p.resource = 'profile' AND p.action IN ('read', 'update'))
        OR (p.resource = 'asset' AND p.action = 'read')
        -- Admin-specific permissions
        OR (p.resource = 'company_setting' AND p.action IN ('read', 'update', 'delete'))
        OR (p.resource = 'client_profile' AND p.action IN ('read', 'update', 'delete'))
        OR (p.resource = 'client_password' AND p.action = 'update')
        OR (p.resource = 'billing' AND p.action = 'read')
      )
      ON CONFLICT (tenant, role_id, permission_id) DO NOTHING
    `, [tenant, tenant, tenant]);

    // Also assign ticket permissions to client_admin role
    await knex.raw(`
      INSERT INTO role_permissions (tenant, role_id, permission_id)
      SELECT ?, r.role_id, p.permission_id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.tenant = ?
      AND p.tenant = ?
      AND r.role_name = 'client_admin'
      AND p.resource = 'ticket'
      AND p.action IN ('create', 'read', 'update', 'delete')
      ON CONFLICT (tenant, role_id, permission_id) DO NOTHING
    `, [tenant, tenant, tenant]);
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
    // Remove role permissions
    await knex('role_permissions')
      .where('tenant', tenant)
      .whereIn('role_id', function() {
        this.select('role_id')
          .from('roles')
          .where('tenant', tenant)
          .whereIn('role_name', ['client', 'client_admin']);
      })
      .whereIn('permission_id', function() {
        this.select('permission_id')
          .from('permissions')
          .where('tenant', tenant)
          .where(function() {
            this.where(function() {
              this.where('resource', 'profile')
                .whereIn('action', ['read', 'update']);
            })
            .orWhere(function() {
              this.where('resource', 'asset')
                .where('action', 'read');
            })
            .orWhere(function() {
              this.where('resource', 'company_setting')
                .whereIn('action', ['read', 'update', 'delete']);
            })
            .orWhere(function() {
              this.where('resource', 'client_profile')
                .whereIn('action', ['read', 'update', 'delete']);
            })
            .orWhere(function() {
              this.where('resource', 'client_password')
                .where('action', 'update');
            })
            .orWhere(function() {
              this.where('resource', 'billing')
                .where('action', 'read');
            });
          });
      })
      .delete();

    // Remove new permissions
    await knex('permissions')
      .where('tenant', tenant)
      .where(function() {
        this.where(function() {
          this.where('resource', 'profile')
            .whereIn('action', ['read', 'update']);
        })
        .orWhere(function() {
          this.where('resource', 'asset')
            .where('action', 'read');
        })
        .orWhere(function() {
          this.where('resource', 'company_setting')
            .whereIn('action', ['read', 'update', 'delete']);
        })
        .orWhere(function() {
          this.where('resource', 'client_profile')
            .whereIn('action', ['read', 'update', 'delete']);
        })
        .orWhere(function() {
          this.where('resource', 'client_password')
            .where('action', 'update');
        })
        .orWhere(function() {
          this.where('resource', 'billing')
            .where('action', 'read');
        });
      })
      .delete();

    // Remove client_admin role
    await knex('roles')
      .where('tenant', tenant)
      .where('role_name', 'client_admin')
      .delete();
  }
};
