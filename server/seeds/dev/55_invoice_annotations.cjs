/* eslint-disable no-undef */
exports.seed = function (knex) {
    return knex('invoice_annotations').del()
        .then(() => {
            return knex('invoice_annotations').insert([
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    annotation_id: knex.raw('gen_random_uuid()'),
                    invoice_id: knex('invoices').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', invoice_number: 'INV-003' }).select('invoice_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'glinda' }).select('user_id').first(),
                    content: 'Customer requested itemized breakdown of Rabbit Tracking hours.',
                    is_internal: true
                },
                {
                    tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    annotation_id: knex.raw('gen_random_uuid()'),
                    invoice_id: knex('invoices').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', invoice_number: 'INV-004' }).select('invoice_id').first(),
                    user_id: knex('users').where({ tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'dorothy' }).select('user_id').first(),
                    content: 'Applied 5% discount as per agreement.',
                    is_internal: false
                }
            ]);
        });
};