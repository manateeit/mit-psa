exports.seed = async function(knex) {
  const projects = await knex('projects').select('project_id', 'tenant');

  // Get all standard statuses for project_task
  const standardStatuses = await knex('standard_statuses')
    .where('item_type', 'project_task')
    .orderBy('display_order');

  // Prepare the data to be inserted
  const statusMappings = [];
  for (const project of projects) {
    for (const status of standardStatuses) {
      statusMappings.push({
        tenant: project.tenant,
        project_id: project.project_id,
        custom_name: status.name,
        display_order: status.display_order,
        is_visible: true,
        standard_status_id: status.standard_status_id,
        is_standard: true
      });
    }
  }

  // Insert the prepared data
  await knex('project_status_mappings').insert(statusMappings);
};
