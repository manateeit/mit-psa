exports.seed = function (knex) {
    return knex('service_categories').del()
        .then(() => {
            return knex('service_categories').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Network Services', description: 'Services related to network infrastructure' },
                { tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Security Services', description: 'Services focused on cybersecurity' },
                { tenant: '11111111-1111-1111-1111-111111111111', category_name: 'Cloud Services', description: 'Cloud-based solutions and management' }
            ]);
        });
};