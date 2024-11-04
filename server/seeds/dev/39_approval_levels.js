exports.seed = function (knex) {
    return knex('approval_levels').del()
        .then(() => {
            return knex('approval_levels').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', name: 'Team Lead', order_num: 1 },
                { tenant: '11111111-1111-1111-1111-111111111111', name: 'Manager', order_num: 2 },
                { tenant: '11111111-1111-1111-1111-111111111111', name: 'Director', order_num: 3 }
            ]);
        });
};