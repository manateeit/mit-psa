exports.seed = function (knex) {
    return knex('custom_fields').del()
        .then(() => {
            return knex('custom_fields').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    field_id: knex.raw('gen_random_uuid()'),
                    name: 'Payment Terms',
                    type: 'text',
                    default_value: JSON.stringify([
                        {
                            name: 'Net 30',
                            value: 'net_30'
                        },
                        {
                            name: 'Net 45',
                            value: 'net_45'
                        },
                        {
                            name: 'Net 60',
                            value: 'net_60'
                        }
                    ])
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    field_id: knex.raw('gen_random_uuid()'),
                    name: 'Customer PO',
                    type: 'text',
                    default_value: null
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    field_id: knex.raw('gen_random_uuid()'),
                    name: 'Discount',
                    type: 'number',
                    default_value: '0'
                }
            ]);
        });
};