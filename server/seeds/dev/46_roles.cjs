exports.seed = function (knex) {
    return knex('roles').del()
        .then(() => {
            return knex('roles').insert([
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role_name: 'Admin', description: 'Full system access' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role_name: 'Manager', description: 'Manage tickets and users' },
                { tenant: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role_name: 'Technician', description: 'Handle tickets' }
            ]);
        });
};