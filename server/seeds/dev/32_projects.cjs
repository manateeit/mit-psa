exports.seed = async function (knex) {
    // Insert projects
    const [wonderlandProject, emeraldCityProject] = await knex('projects').insert([
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id'),
            project_name: 'Wonderland Expansion',
            description: 'Expanding Wonderland territories and improving infrastructure',
            start_date: knex.raw("CURRENT_DATE - INTERVAL '2 months'"),
            end_date: knex.raw("CURRENT_DATE + INTERVAL '10 months'"),
            wbs_code: '1',
            status: knex('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Casting in Progress', 'status_type': 'project' }).select('status_id').first()
        },
        {
            tenant: '11111111-1111-1111-1111-111111111111',
            company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Emerald City' }).select('company_id'),
            project_name: 'Emerald City Beautification',
            description: 'Enhancing the beauty and safety of Emerald City',
            start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
            end_date: knex.raw("CURRENT_DATE + INTERVAL '5 months'"),
            wbs_code: '2',
            status: knex('statuses').where({ tenant: '11111111-1111-1111-1111-111111111111', name: 'Casting in Progress', 'status_type': 'project' }).select('status_id').first()
        }
    ]).returning('*');


};