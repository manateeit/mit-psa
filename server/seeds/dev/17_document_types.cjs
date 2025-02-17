exports.seed = function (knex) {
    return knex('document_types').del()
        .then(() => {
            return knex('document_types').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Ticket' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type_name: 'Schedule' }
            ]);
        });
};