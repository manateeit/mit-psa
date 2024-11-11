exports.seed = function (knex) {
    return knex('tags').del()
        .then(() => {
            return knex('tags').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    channel_id: knex('channels').where({ tenant: '11111111-1111-1111-1111-111111111111', channel_name: 'Urgent Matters' }).select('channel_id').first(),
                    tag_text: 'Urgent',
                    tagged_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    tagged_type: 'ticket'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    channel_id: null,
                    tag_text: 'White Rabbit',
                    tagged_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    tagged_type: 'ticket'
                }
            ]);
        });
};