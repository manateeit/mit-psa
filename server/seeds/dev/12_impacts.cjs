exports.seed = function(knex) {
    return knex('impacts').del()
        .then(() => {
            return knex('impacts').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', impact_name: 'Individual Inconvenience', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', impact_name: 'Local Disruption', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', impact_name: 'Realm-Wide Repercussions', created_by: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first() }
            ]);
        });      
};
