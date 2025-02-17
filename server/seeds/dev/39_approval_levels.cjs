exports.seed = function (knex) {
    return knex('approval_levels').del()
        .then(() => {
            return knex('approval_levels').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Team Lead', order_num: 1 },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Manager', order_num: 2 },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Director', order_num: 3 }
            ]);
        });
};