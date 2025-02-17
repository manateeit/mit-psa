exports.seed = function (knex) {
    return knex('billing_plans').del()
        .then(() => {
            return knex('billing_plans').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    plan_name: 'Wonderland Basic',
                    description: 'Basic services for Wonderland residents',
                    billing_frequency: 'Monthly',
                    is_custom: false,
                    plan_type: 'Fixed'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    plan_name: 'Oz Premium',
                    description: 'Premium services for Emerald City',
                    billing_frequency: 'Monthly',
                    is_custom: false,
                    plan_type: 'Fixed'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    plan_name: 'Custom Cheshire',
                    description: 'Custom plan for special clients',
                    billing_frequency: 'Quarterly',
                    is_custom: true,
                    plan_type: 'Hourly'
                }
            ]);
        });
};