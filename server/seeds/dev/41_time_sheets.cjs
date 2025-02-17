exports.seed = function (knex) {
    return knex('time_sheets').del()
        .then(() => {
            return knex('time_sheets').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    period_id: knex('time_periods').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}).select('period_id').first(),
                    approval_status: 'SUBMITTED',
                    submitted_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 days'")
                }]);
        });
};
                