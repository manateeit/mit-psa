exports.seed = function (knex) {
    return knex('time_period_types').del()
        .then(() => {
            return knex('time_period_types').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Weekly', description: 'Weekly time tracking period' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Monthly', description: 'Monthly time tracking period' }
            ]);
        });
};