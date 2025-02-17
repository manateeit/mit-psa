exports.seed = function (knex) {
    return knex('comments').del()
        .then(() => {
            return knex('comments').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    comment_id: knex.raw('gen_random_uuid()'),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    note: 'Initial report of missing White Rabbit. Last seen heading towards the tea party.',
                    is_internal: false,
                    is_resolution: false,
                    is_initial_description: true,
                    created_at: knex.fn.now()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    comment_id: knex.raw('gen_random_uuid()'),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    note: 'Last seen heading towards the tea party.',
                    is_internal: true,
                    is_resolution: false,
                    is_initial_description: false,
                    created_at: knex.fn.now()
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    comment_id: knex.raw('gen_random_uuid()'),
                    ticket_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    note: 'White Rabbit was arrested at the tea party.',
                    is_internal: false,
                    is_resolution: true,
                    is_initial_description: false,
                    created_at: knex.fn.now()
                }]);
        });
};