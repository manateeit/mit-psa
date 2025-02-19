exports.seed = function(knex) {
    return knex('channels').del()
        .then(() => {
            return knex('tenants').select('tenant').first();
        })
        .then((tenant) => {
            if (tenant) {
                return knex('channels').insert([
                    {
                        tenant: tenant.tenant,
                        channel_name: 'Urgent Matters'
                    },
                    {
                        tenant: tenant.tenant,
                        channel_name: 'General Support',
                        is_default: true
                    },
                    {
                        tenant: tenant.tenant,
                        channel_name: 'Technical Issues'
                    },
                    {
                        tenant: tenant.tenant,
                        channel_name: 'Projects'
                    }
                ]);
            }
        });
};