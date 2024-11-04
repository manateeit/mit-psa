exports.seed = function (knex) {
    return knex('schedules').del()
        .then(() => {
            return knex('schedules').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: '11111111-1111-1111-1111-111111111111' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    company_id: knex('companies').where({ tenant: '11111111-1111-1111-1111-111111111111', company_name: 'Wonderland' }).select('company_id').first(),
                    status: 'In Progress',
                    scheduled_start: knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 hours'"),
                    scheduled_end: knex.raw("CURRENT_TIMESTAMP + INTERVAL '1 hour'"),
                    actual_start: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 hours'"),
                    duration_minutes: 120,
                    description: 'searching for rabbit'
                }
            ]);
        });
};