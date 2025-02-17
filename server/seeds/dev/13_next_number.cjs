exports.seed = function (knex) {
    return knex('next_number').del()
        .then(() => {
            return knex('next_number').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', entity_type: 'TICKET', last_number: 1000, initial_value: 1000, prefix: 'TIC' },
            ]);
        });
};