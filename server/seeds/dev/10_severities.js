exports.seed = function(knex) {
    return knex('severities').del()
        .then(() => {
            return knex('severities').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Trifling Trouble', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Moderate Muddle', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', severity_name: 'Serious Snarl', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() }
            ]);
        });
};