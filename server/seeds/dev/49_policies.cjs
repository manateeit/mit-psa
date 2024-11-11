exports.seed = function (knex) {
    return knex('policies').del()
        .then(() => {
            return knex('policies').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    policy_name: 'Admin Full Access',
                    resource: 'all',
                    action: 'all',
                    conditions: JSON.stringify([
                        {
                            userAttribute: 'roles',
                            operator: 'contains',
                            resourceAttribute: 'Admin'
                        }
                    ])
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    policy_name: 'Manager Ticket Access',
                    resource: 'ticket',
                    action: 'read',
                    conditions: JSON.stringify([
                        {
                            userAttribute: 'roles',
                            operator: 'contains',
                            resourceAttribute: 'Manager'
                        }
                    ])
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    policy_name: 'Technician Ticket View',
                    resource: 'ticket',
                    action: 'read',
                    conditions: JSON.stringify([
                        {
                            userAttribute: 'roles',
                            operator: 'contains',
                            resourceAttribute: 'Technician'
                        }
                    ])
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    policy_name: 'High Priority Ticket Edit',
                    resource: 'ticket',
                    action: 'update',
                    conditions: JSON.stringify([
                        {
                            userAttribute: 'roles',
                            operator: 'contains',
                            resourceAttribute: 'Technician'
                        },
                        {
                            userAttribute: 'department',
                            operator: '==',
                            resourceAttribute: 'priority'
                        }
                    ])
                }
            ]);
        });
};