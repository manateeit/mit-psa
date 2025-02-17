exports.seed = function (knex) {
    return knex('approval_thresholds').del()
        .then(() => {
            return knex('approval_thresholds').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'OVERTIME', threshold: 40, approval_level_id: knex('approval_levels').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Team Lead' }).select('id').first() },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'HIGH_VALUE', threshold: 1000, approval_level_id: knex('approval_levels').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Manager' }).select('id').first() }
            ]);
        });
};