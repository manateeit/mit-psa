// -- Sessions

exports.seed = function(knex) {
return knex('sessions').del()
    .then(() => {
        return knex('users').select('user_id').where({
            tenant: '11111111-1111-1111-1111-111111111111',
            username: 'glinda'
        }).first();
    })
    .then((user) => {
        if (user) {
            return knex('sessions').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    user_id: user.user_id,
                    token: 'sample_token_1234567890',
                    created_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 hour'")
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    user_id: user.user_id,
                    token: 'sample_token_0987654321',
                    created_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '30 minutes'")
                }
            ]);
        }
    });
};
