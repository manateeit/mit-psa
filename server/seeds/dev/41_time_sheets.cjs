exports.seed = function (knex) {
    return knex('time_sheets').del()
        .then(() => {
            return knex('time_sheets').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    period_id: knex('time_periods').where({ tenant: '11111111-1111-1111-1111-111111111111'}).select('period_id').first(),
                    approval_status: 'SUBMITTED',
                    submitted_at: knex.raw("CURRENT_TIMESTAMP - INTERVAL '2 days'")
                }]);
        });
};
                