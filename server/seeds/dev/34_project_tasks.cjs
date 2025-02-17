exports.seed = function (knex) {
    return knex('project_tasks').del()
        .then(() => {
            return knex('project_tasks').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    phase_id: knex('project_phases').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', phase_name: 'Territory Survey' }).select('phase_id').first(),
                    task_name: 'Map New Areas',
                    description: 'Create detailed maps of newly discovered areas',
                    assigned_to: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    estimated_hours: 40,
                    actual_hours: 35,
                    status_id: knex('statuses').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Magic Accomplished' }).select('status_id').first(),
                    wbs_code: '1.1.1'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    phase_id: knex('project_phases').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', phase_name: 'Infrastructure Planning' }).select('phase_id').first(),
                    task_name: 'Design Road Network',
                    description: 'Planning road network for Wonderland expansion',
                    assigned_to: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    estimated_hours: 60,
                    actual_hours: null,
                    status_id: knex('statuses').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Wand-Waving' }).select('status_id').first(),
                    wbs_code: '1.2.1'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    phase_id: knex('project_phases').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', phase_name: 'Green Space Enhancement' }).select('phase_id').first(),
                    task_name: 'Plant Magical Flowers',
                    description: 'Plant new species of magical flowers in Emerald City parks',
                    assigned_to: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    estimated_hours: 20,
                    actual_hours: 15,
                    status_id: knex('statuses').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Brewing Potion' }).select('status_id').first(),
                    wbs_code: '2.1.1'
                }
            ]);
        });
};