exports.seed = function (knex) {
    return knex('roles').del()
        .then(() => {
            return knex('roles').insert([
                { tenant: '11111111-1111-1111-1111-111111111111', role_name: 'Admin', description: 'Full system access' },
                { tenant: '11111111-1111-1111-1111-111111111111', role_name: 'Manager', description: 'Manage tickets and users' },
                { tenant: '11111111-1111-1111-1111-111111111111', role_name: 'Technician', description: 'Handle tickets' }
            ]);
        });
};