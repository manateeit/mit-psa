exports.seed = function(knex) {
    return knex('contacts').del()
        .then(() => {
            return knex('tenants').select('tenant').first();
        })
        .then((tenant) => {
            if (tenant) {
                return knex('contacts').insert([
                    {
                        tenant: '11111111-1111-1111-1111-111111111111',
                        full_name: 'Dorothy Gale',
                        company_id: knex('companies')
                            .where({
                                tenant: '11111111-1111-1111-1111-111111111111',
                                company_name: 'Emerald City'
                            })
                            .select('company_id')
                            .first(),
                        phone_number: '+1-555-987-6543',
                        email: 'dorothy@oz.com',
                        created_at: knex.fn.now()
                    },
                    {
                        tenant: '11111111-1111-1111-1111-111111111111',
                        full_name: 'Alice in Wonderland',
                        company_id: knex('companies')
                            .where({
                                tenant: '11111111-1111-1111-1111-111111111111',
                                company_name: 'Wonderland'
                            })
                            .select('company_id')
                            .first(),
                        phone_number: '+1-555-246-8135',
                        email: 'alice@wonderland.com',
                        created_at: knex.fn.now()
                    }
                ]);
            }
        });
};