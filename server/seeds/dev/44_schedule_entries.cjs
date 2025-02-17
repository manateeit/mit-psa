exports.seed = async function (knex) {
    // Clear existing entries
    await knex('schedule_entry_assignees').del();
    await knex('schedule_entries').del();

    // Create schedule entries
    const entries = [
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            title: 'Cheshire Cat Pathways',
            work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
            scheduled_start: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day'"),
            scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '1 day'"),
            status: 'Scheduled',
            notes: 'Planning road network for Wonderland expansion',
            work_item_type: 'project_task'
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            title: 'Through the Looking Glass Expedition',
            work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
            scheduled_start: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 days'"),
            scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '2 hours'"),
            status: 'Scheduled',
            notes: 'Surveying uncharted areas in Wonderland',
            work_item_type: 'ticket'
        },
        {
            tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            title: 'Emerald City Garden Enchantment',
            work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first(),
            scheduled_start: knex.raw("CURRENT_TIMESTAMP + INTERVAL '3 days'"),
            scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '3 hours'"),
            status: 'Scheduled',
            notes: 'Enhancing Emerald City gardens with magical flora',
            work_item_type: 'ticket'
        }
    ];

    // Insert schedule entries and get their IDs
    const [firstEntry, secondEntry, thirdEntry] = await knex('schedule_entries')
        .insert(entries)
        .returning(['tenant', 'entry_id']);

    // Get user ID for glinda
    const glinda = await knex('users')
        .where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' })
        .select('user_id')
        .first();

    // Create assignee relationships
    await knex('schedule_entry_assignees').insert([
        {
            tenant: firstEntry.tenant,
            entry_id: firstEntry.entry_id,
            user_id: glinda.user_id
        },
        {
            tenant: secondEntry.tenant,
            entry_id: secondEntry.entry_id,
            user_id: glinda.user_id
        },
        {
            tenant: thirdEntry.tenant,
            entry_id: thirdEntry.entry_id,
            user_id: glinda.user_id
        }
    ]);
};
