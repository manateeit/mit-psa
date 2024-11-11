exports.seed = function (knex) {
    return knex('next_number').del()
        .then(() => {
            return knex('next_number').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', entity_type: 'TICKET', last_number: 1000, initial_value: 1000, prefix: 'TIC' },
            ]);
        });
};