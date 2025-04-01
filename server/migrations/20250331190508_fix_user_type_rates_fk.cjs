/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('user_type_rates', function(table) {
    // Drop the potentially existing foreign key constraint (by columns, as name might be wrong)
    try {
      console.log("Attempting to drop existing FK on user_type_rates referencing plan_service_hourly_config using columns ['tenant', 'config_id']");
      // Drop by columns, letting Knex find the constraint name
      table.dropForeign(['tenant', 'config_id']);
      console.log("Successfully dropped existing FK on user_type_rates.");
    } catch (e) {
      console.warn(`Could not drop FK on user_type_rates using columns ['tenant', 'config_id']: ${e.message}. This might be okay if it was already dropped or named differently.`);
      // Attempt dropping by the old simple key as a fallback, in case it was never made composite
      try {
          console.log("Fallback: Attempting to drop FK on user_type_rates using simple column ['config_id']");
          table.dropForeign(['config_id']);
          console.log("Successfully dropped existing FK on user_type_rates using simple column ['config_id'].");
      } catch (e2) {
          console.warn(`Could not drop FK on user_type_rates using simple column ['config_id'] either: ${e2.message}. Assuming constraint doesn't exist.`);
      }
    }

    // Add the correct composite foreign key constraint referencing plan_service_hourly_config (singular)
    console.log("Adding correct composite FK user_type_rates_config_id_foreign referencing plan_service_hourly_config(tenant, config_id)");
    table.foreign(['tenant', 'config_id']) // Constraint name will be auto-generated unless specified
         .references(['tenant', 'config_id'])
         .inTable('plan_service_hourly_config') // Reference the correct table (singular)
         .onDelete('CASCADE'); // Add cascade delete back
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('user_type_rates', function(table) {
    // Drop the corrected foreign key constraint
    try {
      console.log("Rolling back: Dropping corrected composite FK user_type_rates_config_id_foreign");
      table.dropForeign(['tenant', 'config_id'], 'user_type_rates_config_id_foreign');
    } catch (e) {
       console.error(`Could not drop corrected composite FK user_type_rates_config_id_foreign during rollback: ${e.message}`);
    }

    // Re-add the original incorrect foreign key constraint (referencing singular table)
    // This might fail if the singular table doesn't exist anymore, handle potential error
    try {
        console.log("Rolling back: Re-adding incorrect FK user_type_rates_config_id_foreign referencing plan_service_hourly_config (singular)");
        table.foreign('config_id', 'user_type_rates_config_id_foreign')
             .references('config_id')
             .inTable('plan_service_hourly_config'); // Reference the original incorrect table (singular), removed cascade
    } catch (e) {
        console.error(`Could not re-add original incorrect FK during rollback (maybe plan_service_hourly_config doesn't exist?): ${e.message}`);
    }
  });
};
