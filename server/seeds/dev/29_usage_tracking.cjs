exports.seed = function (knex) {
    return knex('usage_tracking').del()
        .then(() => {
            return knex('usage_tracking').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
                    service_id: knex('service_catalog').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', service_name: 'Shrinking Potion' }).select('service_id').first(),
                    usage_date: knex.raw("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 days'"),
                    quantity: 3
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
                    service_id: knex('service_catalog').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', service_name: 'Yellow Brick Road Repair' }).select('service_id').first(),
                    usage_date: knex.raw("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'"),
                    quantity: 2
                }
            ]);
        });
};