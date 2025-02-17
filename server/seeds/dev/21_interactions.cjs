exports.seed = function (knex) {
    return knex('interactions').del()
        .then(() => {
            return knex('interactions').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    type_id: knex('interaction_types').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Call' }).select('type_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    description: 'Discussed details about the missing White Rabbit',
                    interaction_date: knex.raw("CURRENT_TIMESTAMP - INTERVAL '1 day'"),
                    duration: 15
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    type_id: knex('interaction_types').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Email' }).select('type_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    description: 'Sent email with possible White Rabbit locations',
                    interaction_date: knex.raw("CURRENT_TIMESTAMP - INTERVAL '12 hours'"),
                    duration: 5
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    type_id: knex('interaction_types').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Meeting' }).select('type_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }).whereRaw("full_name ILIKE '%dorothy%'").select('contact_name_id').first(),
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Emerald City' }).select('company_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    ticket_id: null,
                    description: 'Scheduled meeting to discuss Emerald City security',
                    interaction_date: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 days'"),
                    duration: 60
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    type_id: knex('interaction_types').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Note' }).select('type_id').first(),
                    contact_name_id: knex('contacts').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }).whereRaw("full_name ILIKE '%alice%'").select('contact_name_id').first(),
                    company_id: knex('companies').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', company_name: 'Wonderland' }).select('company_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    description: 'Added note: White Rabbit spotted near the tea party location',
                    interaction_date: knex.raw("CURRENT_TIMESTAMP - INTERVAL '6 hours'"),
                    duration: null
                }]);
        });
};