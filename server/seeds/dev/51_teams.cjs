exports.seed = function (knex) {
    return knex('teams').del()
        .then(() => {
            return knex('teams').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    team_id: knex.raw('gen_random_uuid()'),
                    team_name: 'Wonderland Team',
                    manager_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    team_id: knex.raw('gen_random_uuid()'),
                    team_name: 'Oz Team',
                    manager_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'dorothy' }).select('user_id').first()
                }
            ]);
        });
};