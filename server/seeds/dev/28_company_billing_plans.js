exports.seed = async function (knex) {
    await knex('company_billing_plans').del();
    
    return knex('company_billing_plans').insert([
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111', plan_name: 'Wonderland Basic' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Network Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '3 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111', plan_name: 'Oz Premium' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Security Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '6 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111', plan_name: 'Oz Premium' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Network Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '6 months'"),
            end_date: null,
            is_active: true
        },
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111', plan_name: 'Custom Cheshire' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Security Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '2 months'"),
            end_date: null,
            is_active: true
        },     
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id').first(),
            plan_id: knex('billing_plans').where({ tenant: '11111111-1111-1111-1111-111111111111', plan_name: 'Custom Cheshire' }).select('plan_id').first(),
            service_category: knex('service_categories').where({ tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Cloud Services' }).select('category_id').first(),
            start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
            end_date: null,
            is_active: true
        }      
    ]);
};