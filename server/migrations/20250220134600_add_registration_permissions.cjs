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
    // Get existing permissions to avoid duplicates
    const existingPerms = await knex('permissions')
      .where({ tenant })
      .whereIn('resource', ['profile', 'asset', 'company_setting', 'client_profile', 'client_password', 'billing'])
      .select('resource', 'action');

    const existingMap = new Set(existingPerms.map(p => `${p.resource}:${p.action}`));

    const permissionsToAdd = [
      { resource: 'profile', action: 'create' },
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'profile', action: 'delete' },
      { resource: 'asset', action: 'create' },
      { resource: 'asset', action: 'read' },
      { resource: 'asset', action: 'update' },
      { resource: 'asset', action: 'delete' },
      { resource: 'company_setting', action: 'create' },
      { resource: 'company_setting', action: 'read' },
      { resource: 'company_setting', action: 'update' },
      { resource: 'company_setting', action: 'delete' },
      { resource: 'client_profile', action: 'create' },
      { resource: 'client_profile', action: 'read' },
      { resource: 'client_profile', action: 'update' },
      { resource: 'client_profile', action: 'delete' },
      { resource: 'client_password', action: 'create' },
      { resource: 'client_password', action: 'read' },
      { resource: 'client_password', action: 'update' },
      { resource: 'client_password', action: 'delete' },
      { resource: 'billing', action: 'create' },
      { resource: 'billing', action: 'read' },
      { resource: 'billing', action: 'update' },
      { resource: 'billing', action: 'delete' },
      { resource: 'ticket', action: 'create' },
      { resource: 'ticket', action: 'read' },
      { resource: 'ticket', action: 'update' },
      { resource: 'ticket', action: 'delete' },
      { resource: 'project', action: 'create' },
      { resource: 'project', action: 'read' },
      { resource: 'project', action: 'update' },
      { resource: 'project', action: 'delete' }
    ].filter(p => !existingMap.has(`${p.resource}:${p.action}`))
     .map(p => ({
       tenant,
       permission_id: knex.raw('gen_random_uuid()'),
       ...p
     }));

    if (permissionsToAdd.length > 0) {
      await knex('permissions').insert(permissionsToAdd);
    }

    // Check if client_admin role exists before inserting
    const existingRole = await knex('roles')
      .where({ tenant, role_name: 'client_admin' })
      .first();
    
    if (!existingRole) {
      await knex('roles').insert({
        tenant,
        role_id: knex.raw('gen_random_uuid()'),
        role_name: 'client_admin',
        description: 'Client administrator role'
      });
    }

    // Get client role
    const clientRole = await knex('roles')
      .where({ tenant, role_name: 'client' })
      .first();

    // Get client_admin role
    const clientAdminRole = await knex('roles')
      .where({ tenant, role_name: 'client_admin' })
      .first();

    if (clientRole) {
      // Get permissions for client role
      const clientPermissions = await knex('permissions')
        .where({ tenant })
        .where(function() {
          this.where('resource', 'project').andWhere('action', 'read')
            .orWhere(function() {
              this.where('resource', 'profile').whereIn('action', ['read', 'update']);
            })
            .orWhere(function() {
              this.where('resource', 'asset').andWhere('action', 'read');
            });
        });

      // Check existing role permissions
      for (const perm of clientPermissions) {
        const exists = await knex('role_permissions')
          .where({
            tenant,
            role_id: clientRole.role_id,
            permission_id: perm.permission_id
          })
          .first();

        if (!exists) {
          await knex('role_permissions').insert({
            tenant,
            role_id: clientRole.role_id,
            permission_id: perm.permission_id
          });
        }
      }
    }

    if (clientAdminRole) {
      // Get permissions for client_admin role
      const adminPermissions = await knex('permissions')
        .where({ tenant })
        .where(function() {
          this.where(function() {
              this.where('resource', 'project').whereIn('action', ['create', 'read', 'update', 'delete']);
            })
            .orWhere(function() {
              this.where('resource', 'profile').whereIn('action', ['read', 'update']);
            })
            .orWhere(function() {
              this.where('resource', 'asset').andWhere('action', 'read');
            })
            .orWhere(function() {
              this.where('resource', 'company_setting').whereIn('action', ['read', 'update', 'delete']);
            })
            .orWhere(function() {
              this.where('resource', 'client_profile').whereIn('action', ['read', 'update', 'delete']);
            })
            .orWhere(function() {
              this.where('resource', 'client_password').andWhere('action', 'update');
            })
            .orWhere(function() {
              this.where('resource', 'billing').andWhere('action', 'read');
            })
            .orWhere(function() {
              this.where('resource', 'ticket').whereIn('action', ['create', 'read', 'update', 'delete']);
            });
        });

      // Check existing role permissions
      for (const perm of adminPermissions) {
        const exists = await knex('role_permissions')
          .where({
            tenant,
            role_id: clientAdminRole.role_id,
            permission_id: perm.permission_id
          })
          .first();

        if (!exists) {
          await knex('role_permissions').insert({
            tenant,
            role_id: clientAdminRole.role_id,
            permission_id: perm.permission_id
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
