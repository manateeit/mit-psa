exports.seed = function (knex) {
    return knex('schedule_conflicts').del()
        .then(() => {
            return knex('schedule_conflicts').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    entry_id_1: knex('schedule_entries').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Cheshire Cat Pathways' }).select('entry_id').first(),
                    entry_id_2: knex('schedule_entries').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Through the Looking Glass Expedition' }).select('entry_id').first(),
                    conflict_type: 'Overlap',
                    resolved: false,
                    resolution_notes: 'Potential overlap in scheduled tasks'
                }
            ]);
        });
};