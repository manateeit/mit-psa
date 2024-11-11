exports.seed = function (knex) {
    return knex('time_period_types').del()
        .then(() => {
            return knex('time_period_types').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Weekly', description: 'Weekly time tracking period' },
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Monthly', description: 'Monthly time tracking period' }
            ]);
        });
};