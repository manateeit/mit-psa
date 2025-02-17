exports.seed = function (knex) {   
    return knex('permissions').del()
        .then(() => {
            return knex('permissions').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'ticket',
                    action: 'create'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'ticket',
                    action: 'read'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'ticket',
                    action: 'update'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'ticket',
                    action: 'delete'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'user',
                    action: 'create'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'user',
                    action: 'read'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'user',
                    action: 'update'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    resource: 'user',
                    action: 'delete'
                }                
            ]);
        });
};