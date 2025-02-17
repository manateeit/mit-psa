exports.seed = function (knex) {
    return knex('tags').del()
        .then(() => {
            return knex('tags').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    channel_id: knex('channels').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', channel_name: 'Urgent Matters' }).select('channel_id').first(),
                    tag_text: 'Urgent',
                    tagged_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    tagged_type: 'ticket'
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    channel_id: null,
                    tag_text: 'White Rabbit',
                    tagged_id: knex('tickets').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    tagged_type: 'ticket'
                }
            ]);
        });
};