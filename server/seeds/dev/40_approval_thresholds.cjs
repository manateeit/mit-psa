exports.seed = function (knex) {
    return knex('approval_thresholds').del()
        .then(() => {
            return knex('approval_thresholds').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', type: 'OVERTIME', threshold: 40, approval_level_id: knex('approval_levels').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Team Lead' }).select('id').first() },
                { tenant: '11111111-1111-1111-1111-111111111111', type: 'HIGH_VALUE', threshold: 1000, approval_level_id: knex('approval_levels').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Manager' }).select('id').first() }
            ]);
        });
};