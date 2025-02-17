exports.seed = async function (knex) {
    await knex('company_billing_plans').del();
    
    return knex('company_billing_plans').insert([
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Wonderland Basic' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Network Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '3 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Oz Premium' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Security Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '6 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Oz Premium' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Network Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '6 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Custom Cheshire' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Security Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '2 months'"),
            end_date: null,
            is_active: true
        },     
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', plan_name: 'Custom Cheshire' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Cloud Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
            end_date: null,
            is_active: true
        }      
    ]);
};