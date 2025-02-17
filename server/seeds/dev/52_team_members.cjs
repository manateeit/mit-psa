exports.seed = function (knex) {
    return knex('team_members').del()
        .then(() => {
            return knex('team_members').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    team_id: knex('teams').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', team_name: 'Wonderland Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    team_id: knex('teams').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', team_name: 'Oz Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'dorothy' }).select('user_id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    team_id: knex('teams').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', team_name: 'Oz Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'scarecrow' }).select('user_id').first()
                }
            ]);
        });
};