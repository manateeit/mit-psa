exports.seed = function (knex) {
    return knex('teams').del()
        .then(() => {
            return knex('teams').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    team_id: knex.raw('gen_random_uuid()'),
                    team_name: 'Wonderland Team',
                    manager_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    team_id: knex.raw('gen_random_uuid()'),
                    team_name: 'Oz Team',
                    manager_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'dorothy' }).select('user_id').first()
                }
            ]);
        });
};