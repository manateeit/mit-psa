exports.seed = function (knex) {
    return knex('project_ticket_links').del()
        .then(() => {
            return knex('project_ticket_links').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    project_id: knex('projects').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', project_name: 'Wonderland Expansion' }).select('project_id').first(),
                    phase_id: knex('project_phases').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', phase_name: 'Territory Survey' }).select('phase_id').first(),
                    task_id: knex('project_tasks').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', task_name: 'Map New Areas' }).select('task_id').first(),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Survey Uncharted Areas in Wonderland' }).select('ticket_id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    project_id: knex('projects').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', project_name: 'Emerald City Beautification' }).select('project_id').first(),
                    phase_id: knex('project_phases').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', phase_name: 'Green Space Enhancement' }).select('phase_id').first(),
                    task_id: knex('project_tasks').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', task_name: 'Plant Magical Flowers' }).select('task_id').first(),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first()
                }
            ]);
        });
};