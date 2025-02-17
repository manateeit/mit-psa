exports.seed = function (knex) {
    return knex('time_entries').del()
        .then(() => {
            return knex('time_entries').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '9 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '11 hours'"),
                    notes: 'Searched for White Rabbit in the Tulgey Wood',
                    work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    billable_duration: 120,
                    work_item_type: 'ticket',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '9 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '11 hours'"),
                    notes: 'Moving on to March Hares Residence',
                    work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    billable_duration: 120,
                    work_item_type: 'ticket',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '8 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '12 hours'"),
                    notes: 'Repaired cracks in the Yellow Brick Road near Munchkinland',
                    work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    billable_duration: 240,
                    work_item_type: 'ticket',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '9 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '11 hours'"),
                    notes: 'Administrative tasks',
                    work_item_id: null,
                    billable_duration: 120,
                    work_item_type: 'non_billable_category',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '9 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '12 hours'"),
                    notes: 'Conducted survey of uncharted areas in Wonderland',
                    work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    billable_duration: 180,
                    work_item_type: 'ticket',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    start_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '10 hours'"),
                    end_time: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '13 hours'"),
                    notes: 'Worked on enhancing Emerald City Gardens',
                    work_item_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first(),
                    billable_duration: 180,
                    work_item_type: 'ticket',
                    approval_status: 'SUBMITTED',
                    time_sheet_id: knex('time_sheets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', approval_status: 'SUBMITTED' }).select('id').first()
                }
            ]);
        });
};