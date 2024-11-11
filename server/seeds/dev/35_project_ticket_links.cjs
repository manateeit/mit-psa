exports.seed = function (knex) {
    return knex('project_ticket_links').del()
        .then(() => {
            return knex('project_ticket_links').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    project_id: knex('projects').where({ tenant: '11111111-1111-1111-1111-111111111111', project_name: 'Wonderland Expansion' }).select('project_id').first(),
                    phase_id: knex('project_phases').where({ tenant: '11111111-1111-1111-1111-111111111111', phase_name: 'Territory Survey' }).select('phase_id').first(),
                    task_id: knex('project_tasks').where({ tenant: '11111111-1111-1111-1111-111111111111', task_name: 'Map New Areas' }).select('task_id').first(),
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Survey Uncharted Areas in Wonderland' }).select('ticket_id').first()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    project_id: knex('projects').where({ tenant: '11111111-1111-1111-1111-111111111111', project_name: 'Emerald City Beautification' }).select('project_id').first(),
                    phase_id: knex('project_phases').where({ tenant: '11111111-1111-1111-1111-111111111111', phase_name: 'Green Space Enhancement' }).select('phase_id').first(),
                    task_id: knex('project_tasks').where({ tenant: '11111111-1111-1111-1111-111111111111', task_name: 'Plant Magical Flowers' }).select('task_id').first(),
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first()
                }
            ]);
        });
};