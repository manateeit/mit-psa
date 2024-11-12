exports.up = function(knex) {
    return knex.schema.createTable('asset_associations', table => {
        table.uuid('tenant').notNullable().references('tenant_id').inTable('tenants');
        table.uuid('asset_id').notNullable().references('asset_id').inTable('assets');
        table.uuid('entity_id').notNullable(); // Can be ticket_id, project_id, etc.
        table.string('entity_type').notNullable(); // 'ticket', 'project', etc.
        table.string('relationship_type').notNullable().defaultTo('affected'); // affected, related, etc.
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.uuid('created_by').notNullable().references('user_id').inTable('users');
        table.text('notes');

        // Primary key
        table.primary(['tenant', 'asset_id', 'entity_id', 'entity_type']);

        // RLS policy
        table.string('rls_tenant').notNullable().defaultTo(knex.raw('current_setting(\'app.current_tenant\')::text'));
        table.check('tenant = rls_tenant', 'enforce_tenant_match');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('asset_associations');
};
