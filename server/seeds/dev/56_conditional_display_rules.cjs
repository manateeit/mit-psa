/* eslint-disable no-undef */
exports.seed = function (knex) {
    return knex('conditional_display_rules').del()
        .then(() => {
            return knex('conditional_display_rules').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    rule_id: knex.raw('gen_random_uuid()'),
                    template_id: knex('invoice_templates').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Detailed Template' }).select('template_id').first(),
                    condition: JSON.stringify([
                        {
                            field: 'total_amount',
                            operator: '>',
                            value: 5000
                        }
                    ]),
                    action: 'show',
                    target: 'discount_field',
                    format: null
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    rule_id: knex.raw('gen_random_uuid()'),
                    template_id: knex('invoice_templates').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Standard Template' }).select('template_id').first(),
                    condition: JSON.stringify([
                        {
                            field: 'is_overdue',
                            operator: '==',
                            value: true
                        }
                    ]),
                    action: 'format',
                    target: 'total_amount',
                    format: JSON.stringify({
                        color: 'red',
                        'font-weight': 'bold'
                    })
                }
            ]);
        });
};