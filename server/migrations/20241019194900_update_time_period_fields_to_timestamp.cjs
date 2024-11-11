exports.up = async function (knex) {
  await knex.raw('DROP VIEW IF EXISTS v_ticket_assignments');

  await knex.schema
    .alterTable('time_periods', function (table) {
      table.timestamp('start_date').alter();
      table.timestamp('end_date').alter();
    })
    .alterTable('time_period_settings', function (table) {
      table.timestamp('effective_from').alter();
      table.timestamp('effective_to').alter();
      table.timestamp('created_at').alter();
      table.timestamp('updated_at').alter();
    })
    .alterTable('time_entries', function (table) {
      table.timestamp('start_time').alter();
      table.timestamp('end_time').alter();
      table.timestamp('created_at').alter();
      table.timestamp('updated_at').alter();
    })
    .alterTable('time_sheets', function (table) {
      table.timestamp('submitted_at').alter();
      table.timestamp('approved_at').alter();
    })
    .alterTable('time_sheet_comments', function (table) {
      table.timestamp('created_at').alter();
    });

  return knex.raw(`
      CREATE OR REPLACE VIEW v_ticket_assignments AS
      SELECT 
          t.tenant,
          t.ticket_id,
          t.ticket_number,
          t.title,
          t.assigned_to AS assigned_to_id,
          uas.username AS assigned_to_username,
          CONCAT(uas.first_name, ' ', uas.last_name) AS assigned_to_full_name,
          tr.additional_user_id,
          uadd.username AS additional_user_username,
          CONCAT(uadd.first_name, ' ', uadd.last_name) AS additional_user_full_name,
          tr.role AS additional_user_role,
          tr.assigned_at,
          s.name AS status,
          p.priority_name AS priority,
          t.company_id,
          c.company_name AS company,
          t.contact_name_id,
          cn.full_name AS contact_name,
          t.entered_at,
          t.updated_at,
          t.closed_at,
          t.is_closed,
          te.start_time,
          te.end_time,
          te.billable_duration
      FROM 
          tickets t
      LEFT JOIN users uas ON t.tenant = uas.tenant AND t.assigned_to = uas.user_id
      LEFT JOIN ticket_resources tr ON t.tenant = tr.tenant AND t.ticket_id = tr.ticket_id
      LEFT JOIN users uadd ON tr.tenant = uadd.tenant AND tr.additional_user_id = uadd.user_id
      LEFT JOIN statuses s ON t.tenant = s.tenant AND t.status_id = s.status_id
      LEFT JOIN priorities p ON t.tenant = p.tenant AND t.priority_id = p.priority_id
      LEFT JOIN companies c ON t.tenant = c.tenant AND t.company_id = c.company_id
      LEFT JOIN contacts cn ON t.tenant = cn.tenant AND t.contact_name_id = cn.contact_name_id
      LEFT JOIN time_entries te ON t.tenant = te.tenant 
          AND t.ticket_id = te.work_item_id 
          AND te.work_item_type = 'ticket'
          AND (
              (tr.additional_user_id IS NOT NULL AND te.user_id = tr.additional_user_id)
              OR (tr.additional_user_id IS NULL AND te.user_id = t.assigned_to)
          )
      ORDER BY 
          t.ticket_id,
          tr.assigned_at DESC,
          te.start_time DESC NULLS LAST;
    `);
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('time_periods', function (table) {
      table.date('start_date').alter();
      table.date('end_date').alter();
    })
    .alterTable('time_period_settings', function (table) {
      table.date('effective_from').alter();
      table.date('effective_to').alter();
      table.date('created_at').alter();
      table.date('updated_at').alter();
    })
    .alterTable('time_entries', function (table) {
      table.datetime('start_time').alter();
      table.datetime('end_time').alter();
      table.datetime('created_at').alter();
      table.datetime('updated_at').alter();
    })
    .alterTable('time_sheets', function (table) {
      table.datetime('submitted_at').alter();
      table.datetime('approved_at').alter();
    })
    .alterTable('time_sheet_comments', function (table) {
      table.datetime('created_at').alter();
    });
};
