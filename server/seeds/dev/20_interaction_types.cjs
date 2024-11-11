exports.seed = function (knex) {
    return knex('interaction_types').del()
        .then(() => {
            return knex('interaction_types').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Call', icon: 'phone' },
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Email', icon: 'mail' },
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Meeting', icon: 'calendar' },
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Note', icon: 'file-text' }
            ]);
        });
};