exports.seed = function (knex) {
    return knex('bucket_plans').del()
        .then(() => {
            return knex('bucket_plans').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Wonderland Basic' }).select('plan_id').first(),
                    total_hours: 40,
                    billing_period: 'Monthly',
                    overage_rate: 100.00
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Oz Premium' }).select('plan_id').first(),
                    total_hours: 100,
                    billing_period: 'Monthly',
                    overage_rate: 150.00
                }
            ]);
        });
};