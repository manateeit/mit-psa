exports.seed = function (knex) {
    return knex('document_types').del()
        .then(() => {
            return knex('document_types').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Ticket' },
                { tenant: '11111111-1111-1111-1111-111111111111', type_name: 'Schedule' }
            ]);
        });
};