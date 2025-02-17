// -- Sessions

exports.seed = function(knex) {
return knex('sessions').del()
    .then(() => {
        return knex('users').select('user_id').where({
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            username: 'glinda'
        }).first();
    })
    .then((user) => {
        if (user) {
            return knex('sessions').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: user.user_id,
                    token: 'sample_token_1234567890',
                    created_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 hour'")
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: user.user_id,
                    token: 'sample_token_0987654321',
                    created_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '30 minutes'")
                }
            ]);
        }
    });
};
