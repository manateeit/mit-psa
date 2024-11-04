// -- Users
exports.seed = async function (knex) {
    // Users
    await knex('users').del()
        .then(function () {
            // Inserts seed entries
            return knex('users').insert([
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'glinda',
                    hashed_password: 'KIXQJZT7qLBlZB6rHn9e1uuEIYVVbIilJ',
                    first_name: 'Glinda',
                    last_name: 'Good',
                    role: 'witch',
                    email: 'glinda@emeraldcity.oz',
                    auth_method: 'magic',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'dorothy',
                    hashed_password: 'LMNOQRST8pMCmD7sIn0f2vvFJZWWcJjmK',
                    first_name: 'Dorothy',
                    last_name: 'Gale',
                    role: 'manager',
                    email: 'dorothy@kansas.oz',
                    auth_method: 'ruby_slippers',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'scarecrow',
                    hashed_password: 'PQRSTUVW9qNDnE8tJo1g3wwGKAXXdKknL',
                    first_name: 'Scarecrow',
                    last_name: 'Brainless',
                    role: 'technician',
                    email: 'scarecrow@cornfield.oz',
                    auth_method: 'straw',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'tinman',
                    hashed_password: 'H34rtL3ssT1n',
                    first_name: 'Tin',
                    last_name: 'Woodman',
                    role: 'user',
                    email: 'tinman@emeraldcity.oz',
                    auth_method: 'password',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'madhatter',
                    hashed_password: 'T34T1m3P4rty!',
                    first_name: 'Mad',
                    last_name: 'Hatter',
                    role: 'user',
                    email: 'hatter@wonderland.com',
                    auth_method: 'password',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'cheshire',
                    hashed_password: 'Gr1nC4t789!',
                    first_name: 'Cheshire',
                    last_name: 'Cat',
                    role: 'user',
                    email: 'cheshire@wonderland.com',
                    auth_method: 'password',
                    created_at: knex.fn.now()
                },
                {
                    tenant: '11111111-1111-1111-1111-111111111111',
                    username: 'queenhearts',
                    hashed_password: 'H34d50ff123!',
                    first_name: 'Queen',
                    last_name: 'Hearts',
                    role: 'admin',
                    email: 'queen@wonderland.com',
                    auth_method: 'password',
                    created_at: knex.fn.now()
                }
            ]);
        });
};
// DO $$
// BEGIN
//     IF is_development() AND NOT EXISTS (SELECT 1 FROM users WHERE tenant = '11111111-1111-1111-1111-111111111111') THEN
//         PERFORM log_message('Inserting fake data to TABLE [ users ]', 'DEBUG');
//         INSERT INTO users (tenant, username, hashed_password, first_name, last_name, role, email, auth_method, created_at)
//         VALUES
//             ('11111111-1111-1111-1111-111111111111', 'glinda', 'KIXQJZT7qLBlZB6rHn9e1uuEIYVVbIilJ', 'Glinda', 'Good', 'witch', 'glinda@emeraldcity.oz', 'magic', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'dorothy', 'LMNOQRST8pMCmD7sIn0f2vvFJZWWcJjmK', 'Dorothy', 'Gale', 'manager', 'dorothy@kansas.oz', 'ruby_slippers', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'scarecrow', 'PQRSTUVW9qNDnE8tJo1g3wwGKAXXdKknL', 'Scarecrow', 'Brainless', 'technician', 'scarecrow@cornfield.oz', 'straw', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'tinman', 'H34rtL3ssT1n', 'Tin', 'Woodman', 'user', 'tinman@emeraldcity.oz', 'password', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'madhatter', 'T34T1m3P4rty!', 'Mad', 'Hatter', 'user', 'hatter@wonderland.com', 'password', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'cheshire', 'Gr1nC4t789!', 'Cheshire', 'Cat', 'user', 'cheshire@wonderland.com', 'password', CURRENT_TIMESTAMP),
//             ('11111111-1111-1111-1111-111111111111', 'queenhearts', 'H34d50ff123!', 'Queen', 'Hearts', 'admin', 'queen@wonderland.com', 'password', CURRENT_TIMESTAMP);
//     END IF;
// END $$;

