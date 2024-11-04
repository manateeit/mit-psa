exports.seed = async function(knex) {
  // Get all users
  const users = await knex('users').select('user_id', 'tenant');

  // Get the Admin role
  const adminRole = await knex('roles')
    .where({ role_name: 'Admin' })
    .first('role_id', 'tenant');

  if (!adminRole) {
    console.error('Admin role not found');
    return;
  }

  // Prepare the data for insertion
  const userRoles = users.map(user => ({
    tenant: user.tenant,
    user_id: user.user_id,
    role_id: adminRole.role_id,
    created_at: new Date()
  }));

  // Insert the user roles
  await knex('user_roles').insert(userRoles);

  console.log(`Assigned Admin role to ${userRoles.length} users`);
}
