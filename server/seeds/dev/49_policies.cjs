exports.seed = function (knex) {
    return knex('policies').del()
        .then(() => {
            return knex('policies').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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