/* eslint-disable no-undef */
exports.seed = function (knex) {
    return knex('invoice_annotations').del()
        .then(() => {
            return knex('invoice_annotations').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    annotation_id: knex.raw('gen_random_uuid()'),
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-003' }).select('invoice_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'glinda' }).select('user_id').first(),
                    content: 'Customer requested itemized breakdown of Rabbit Tracking hours.',
                    is_internal: true
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    annotation_id: knex.raw('gen_random_uuid()'),
                    invoice_id: knex('invoices').where({ tenant: '11111111-1111-1111-1111-111111111111', invoice_number: 'INV-004' }).select('invoice_id').first(),
                    user_id: knex('users').where({ tenant: '11111111-1111-1111-1111-111111111111', username: 'dorothy' }).select('user_id').first(),
                    content: 'Applied 5% discount as per agreement.',
                    is_internal: false
                }
            ]);
        });
};