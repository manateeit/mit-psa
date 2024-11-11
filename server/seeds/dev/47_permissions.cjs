exports.seed = function (knex) {   
    return knex('permissions').del()
        .then(() => {
            return knex('permissions').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'ticket',
                    action: 'create'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'ticket',
                    action: 'read'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'ticket',
                    action: 'update'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'ticket',
                    action: 'delete'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'user',
                    action: 'create'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'user',
                    action: 'read'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'user',
                    action: 'update'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    resource: 'user',
                    action: 'delete'
                }                
            ]);
        });
};