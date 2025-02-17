exports.seed = function (knex) {
    return knex('ticket_resources').del()
        .then(() => {
            return knex('ticket_resources').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first(),
                    assigned_to: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'scarecrow' }).select('user_id').first(),
                    additional_user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    role: 'Consultant',
                    assigned_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '4 hours'")
                }]);
        });
};