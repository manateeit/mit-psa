exports.seed = function (knex) {
    return knex('schedule_conflicts').del()
        .then(() => {
            return knex('schedule_conflicts').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    entry_id_1: knex('schedule_entries').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Cheshire Cat Pathways' }).select('entry_id').first(),
                    entry_id_2: knex('schedule_entries').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Through the Looking Glass Expedition' }).select('entry_id').first(),
                    conflict_type: 'Overlap',
                    resolved: false,
                    resolution_notes: 'Potential overlap in scheduled tasks'
                }
            ]);
        });
};