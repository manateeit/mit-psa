exports.seed = function (knex) {
    return knex('documents').del()
        .then(() => {
            return knex('documents').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    document_name: 'Alice Lost White Rabbit',
                    type_id: knex('document_types').where({ tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Ticket' }).select('type_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    entered_at: knex.fn.now(),
                    content: 'Searched for White Rabbit in Wonderland. No luck yet.'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    document_name: 'Search Notes',
                    type_id: knex('document_types').where({ tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Schedule' }).select('type_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    ticket_id: null,
                    created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    entered_at: knex.fn.now(),
                    content: 'Searched for White Rabbit in Wonderland. No luck yet.'
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    document_name: 'White Rabbit Search Plan',
                    type_id: knex('document_types').where({ tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Ticket' }).select('type_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    ticket_id: knex('tickets').where({ tenant: '11111111-1111-1111-1111-111111111111', title: 'Missing White Rabbit' }).select('ticket_id').first(),
                    created_by: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    entered_at: knex.fn.now(),
                    content: `Further actions for White Rabbit search:
                        1. Check the rabbit hole near the old oak tree.
                        2. Interview the Cheshire Cat for possible sightings.
                        3. Set up carrot traps in key locations around Wonderland.
                        4. Distribute "Missing Rabbit" posters with detailed description and time-keeping habits.
                        5. Investigate any reports of pocket watch ticking in unusual places.
                        6. Coordinate with the Queen of Hearts'' guards for a palace grounds search.
                        7. Monitor all tea parties for any signs of the White Rabbit.
                        8. Check with the Mad Hatter for any recent hat orders fitting the White Rabbit''s size.
                        9. Explore the Tulgey Wood, a known shortcut for hurried rabbits.
                        10. Set up a hotline for Wonderland residents to report any rabbit sightings.`
                }
            ]);
        });
}