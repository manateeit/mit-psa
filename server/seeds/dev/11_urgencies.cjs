exports.seed = function(knex) {
    return knex('urgencies').del()
        .then(() => {
            return knex('urgencies').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Leisurely Lark', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Tick-Tock Task', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', urgency_name: 'Hare-Paced Hustle', created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first() }
            ]);          
        });
};