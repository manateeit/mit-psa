exports.seed = function(knex) {
    return knex('priorities').del()
        .then(() => {
            return knex('priorities').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Whimsical Wish', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Curious Conundrum', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', priority_name: 'Enchanted Emergency', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() }
            ]);
        });
};