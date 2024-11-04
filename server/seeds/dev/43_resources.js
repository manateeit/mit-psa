exports.seed = function (knex) {
    return knex('resources').del()
        .then(() => {
            return knex('resources').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
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