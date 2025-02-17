exports.seed = async function (knex) {
    // Delete existing records first
    await knex('projects').del();

    // Insert projects
    const [wonderlandProject, emeraldCityProject] = await knex('projects').insert([
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id'),
            project_name: 'Wonderland Expansion',
            description: 'Expanding Wonderland territories and improving infrastructure',
            start_date: knex.raw("CURRENT_DATE - INTERVAL '2 months'"),
            end_date: knex.raw("CURRENT_DATE + INTERVAL '10 months'"),
            wbs_code: '1',
            status: knex('statuses').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Casting in Progress', 'status_type': 'project' }).select('status_id').first()
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id'),
            project_name: 'Emerald City Beautification',
            description: 'Enhancing the beauty and safety of Emerald City',
            start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
            end_date: knex.raw("CURRENT_DATE + INTERVAL '5 months'"),
            wbs_code: '2',
            status: knex('statuses').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Casting in Progress', 'status_type': 'project' }).select('status_id').first()
        }
    ]).returning('*');
};