exports.seed = function (knex) {
    return knex('usage_tracking').del()
        .then(() => {
            return knex('usage_tracking').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Shrinking Potion' }).select('service_id').first(),
                    usage_date: knex.raw("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 days'"),
                    quantity: 3
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id').first(),
                    service_id: knex('service_catalog').where({ tenant: '11111111-1111-1111-1111-111111111111', service_name: 'Yellow Brick Road Repair' }).select('service_id').first(),
                    usage_date: knex.raw("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'"),
                    quantity: 2
                }
            ]);
        });
};