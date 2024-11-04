exports.seed = function (knex) {
    return knex('project_phases').del()
        .then(() => {
            return knex('project_phases').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    project_id: knex('projects').where({ tenant: '11111111-1111-1111-1111-111111111111', project_name: 'Wonderland Expansion' }).select('project_id').first(),
                    phase_name: 'Territory Survey',
                    description: 'Surveying new areas for expansion',
                    start_date: knex.raw("CURRENT_DATE - INTERVAL '2 months'"),
                    end_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
                    status: 'Completed',
                    wbs_code: '1.1',
                    order_number: 1
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    project_id: knex('projects').where({ tenant: '11111111-1111-1111-1111-111111111111', project_name: 'Wonderland Expansion' }).select('project_id').first(),
                    phase_name: 'Infrastructure Planning',
                    description: 'Planning new infrastructure for expanded areas',
                    start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
                    end_date: knex.raw("CURRENT_DATE + INTERVAL '1 month'"),
                    status: 'In Progress',
                    wbs_code: '1.2',
                    order_number: 2
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    project_id: knex('projects').where({ tenant: '11111111-1111-1111-1111-111111111111', project_name: 'Emerald City Beautification' }).select('project_id').first(),
                    phase_name: 'Green Space Enhancement',
                    description: 'Improving parks and gardens in Emerald City',
                    start_date: knex.raw("CURRENT_DATE - INTERVAL '1 month'"),
                    end_date: knex.raw("CURRENT_DATE + INTERVAL '2 months'"),
                    status: 'In Progress',
                    wbs_code: '2.1',
                    order_number: 1
                }
            ]);
        });
};