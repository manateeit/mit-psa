exports.seed = function(knex) {
    return knex('severities').del()
        .then(() => {
            return knex('severities').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', severity_name: 'Trifling Trouble', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', severity_name: 'Moderate Muddle', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', severity_name: 'Serious Snarl', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() }
            ]);
        });
};
