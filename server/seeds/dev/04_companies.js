
exports.seed = function(knex) {
    return knex('companies').del()
        .then(() => {
            return knex('tenants').select('tenant').first();
        })
        .then((tenant) => {
            if (tenant) {
                return knex('companies').insert([
                    {
                        tenant: tenant.tenant,
                        company_name: 'Emerald City',
                        phone_no: '555-123-4567',
                        url: 'https://emeraldcity.oz',
                        address: '1010 Emerald Street, Suite 007, ',
                        created_at: knex.fn.now(),
                        client_type: 'company'
                    },
                    {
                        tenant: tenant.tenant,
                        company_name: 'Wonderland',
                        phone_no: '555-789-0123',
                        url: 'https://wonderland.com',
                        address: '42 Rabbit Hole Lane, Underland Woods, Wonderland, WND 1234',
                        created_at: knex.fn.now(),
                        client_type: 'company'
                    },
                    {
                        tenant: tenant.tenant,
                        company_name: 'White Rabbit',
                        phone_no: '555-TIME-123',
                        address: '42 Rabbit Hole Lane, Underland Woods, Wonderland, WND 1234',
                        created_at: knex.fn.now(),
                        client_type: 'individual'
                    }
                ]);
            }
        });
};