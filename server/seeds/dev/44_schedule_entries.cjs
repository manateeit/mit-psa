exports.seed = function (knex) {
    return knex('schedule_entries').del()
        .then(() => {
            return knex('schedule_entries').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Cheshire Cat Pathways',
                    work_item_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    scheduled_start: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day'"),
                    scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '1 day'"),
                    status: 'Scheduled',
                    notes: 'Planning road network for Wonderland expansion',
                    work_item_type: 'project_task'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Through the Looking Glass Expedition',
                    work_item_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    scheduled_start: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 days'"),
                    scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '2 hours'"),
                    status: 'Scheduled',
                    notes: 'Surveying uncharted areas in Wonderland',
                    work_item_type: 'ticket'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    title: 'Emerald City Garden Enchantment',
                    work_item_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    scheduled_start: knex.raw("CURRENT_TIMESTAMP + INTERVAL '3 days'"),
                    scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '3 hours'"),
                    status: 'Scheduled',
                    notes: 'Enhancing Emerald City gardens with magical flora',
                    work_item_type: 'ticket'
                }
            ]);
        });
};