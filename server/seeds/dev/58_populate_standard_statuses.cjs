/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('standard_statuses').del()

  const tenant = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  await knex('standard_statuses').insert([
    { name: 'Planned', item_type: 'project', display_order: 1, tenant: tenant },
    { name: 'In Progress', item_type: 'project', display_order: 2, tenant: tenant },
    { name: 'Completed', item_type: 'project', display_order: 3, tenant: tenant, is_closed: 'true' },
    { name: 'To Do', item_type: 'project_task', display_order: 1, tenant: tenant },
    { name: 'In Progress', item_type: 'project_task', display_order: 2, tenant: tenant },
    { name: 'Done', item_type: 'project_task', display_order: 3, tenant: tenant, is_closed: 'true' },
    { name: 'Open', item_type: 'ticket', display_order: 1, tenant: tenant },
    { name: 'In Progress', item_type: 'ticket', display_order: 2, tenant: tenant },
    { name: 'Resolved', item_type: 'ticket', display_order: 3, tenant: tenant, is_closed: 'true' }
  ]);
};
