exports.seed = function (knex) {
    return knex('resources').del()
        .then(() => {
            return knex('resources').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    availability: JSON.stringify([
                        {
                            monday: true,
                            tuesday: true,
                            wednesday: true,
                            thursday: true,
                            friday: true
                        }
                    ]),
                    skills: ['magic', 'project management', 'customer service'],
                    max_daily_capacity: 8,
                    max_weekly_capacity: 40
                }
            ]);
        });
};