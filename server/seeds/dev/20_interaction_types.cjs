exports.seed = function (knex) {
    return knex('interaction_types').del()
        .then(() => {
            return knex('interaction_types').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Call', icon: 'phone' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Email', icon: 'mail' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Meeting', icon: 'calendar' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Note', icon: 'file-text' }
            ]);
        });
};