exports.seed = function (knex) {
    return knex('tenant_time_period_settings').del()
        .then(() => {
            return knex('tenant_time_period_settings').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    type_id: knex('time_period_types').where({ tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Weekly' }).select('type_id').first(),
                    start_day: 1,
                    start_month: 1,
                    frequency: 1,
                    frequency_unit: 'week',
                    is_active: true,
                    effective_from: knex.raw("CURRENT_DATE - INTERVAL '1 year'")
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    type_id: knex('time_period_types').where({ tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Monthly' }).select('type_id').first(),
                    start_day: 1,
                    start_month: 1,
                    frequency: 1,
                    frequency_unit: 'month',
                    is_active: true,
                    effective_from: knex.raw("CURRENT_DATE - INTERVAL '1 year'")
                }
            ]);
        });
};