exports.seed = function(knex) {
    return knex('impacts').del()
        .then(() => {
            return knex('impacts').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Individual Inconvenience', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Local Disruption', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', impact_name: 'Realm-Wide Repercussions', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() }
            ]);
        });      
};