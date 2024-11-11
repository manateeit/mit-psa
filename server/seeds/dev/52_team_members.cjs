exports.seed = function (knex) {
    return knex('team_members').del()
        .then(() => {
            return knex('team_members').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    team_id: knex('teams').where({ tenant: '11111111-1111-1111-1111-111111111111', team_name: 'Wonderland Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    team_id: knex('teams').where({ tenant: '11111111-1111-1111-1111-111111111111', team_name: 'Oz Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'dorothy' }).select('user_id').first()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    team_id: knex('teams').where({ tenant: '11111111-1111-1111-1111-111111111111', team_name: 'Oz Team' }).select('team_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'scarecrow' }).select('user_id').first()
                }
            ]);
        });
};