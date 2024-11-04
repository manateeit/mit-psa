exports.seed = function (knex) {
    return knex('ticket_resources').del()
        .then(() => {
            return knex('ticket_resources').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Enhance Emerald City Gardens' }).select('ticket_id').first(),
                    assigned_to: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'scarecrow' }).select('user_id').first(),
                    additional_user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    role: 'Consultant',
                    assigned_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '3 days' - INTERVAL '4 hours'")
                }]);
        });
};