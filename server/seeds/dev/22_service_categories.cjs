exports.seed = function (knex) {
    return knex('service_categories').del()
        .then(() => {
            return knex('service_categories').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Network Services', description: 'Services related to network infrastructure' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Security Services', description: 'Services focused on cybersecurity' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', category_name: 'Cloud Services', description: 'Cloud-based solutions and management' }
            ]);
        });
};