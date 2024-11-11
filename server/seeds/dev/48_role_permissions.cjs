// /Users/robertisaacs/sebastian/server/seeds/dev/51_role_permissions.js

exports.seed = async function (knex) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return knex('role_permissions').del()
        .then(() => {
            return knex('role_permissions').insert(function () {
                this.select(
                    knex.raw('?', [tenantId]),
                    'r.role_id',
                    'p.permission_id'
                )
                    .from('roles as r')
                    .crossJoin('permissions as p')
                    .where('r.tenant', tenantId)
                    .andWhere('p.tenant', tenantId)
                    .andWhere(function () {
                        this.where('r.role_name', 'Admin')
                            .orWhere(function () {
                                this.where('r.role_name', 'Manager')
                                    .andWhere('p.resource', 'ticket');
                            })
                            .orWhere(function () {
                                this.where('r.role_name', 'Technician')
                                    .andWhere('p.resource', 'ticket')
                                    .whereIn('p.action', ['read', 'update']);
                            });
                    });
            });

        });
};