/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable('asset_types', table => {
            table.uuid('tenant').notNullable().references('tenant_id').inTable('tenants');
            table.uuid('type_id').defaultTo(knex.raw('gen_random_uuid()')).notNullable();
            table.text('type_name').notNullable();
            table.uuid('parent_type_id');
            table.jsonb('attributes_schema');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            
            table.primary(['tenant', 'type_id']);
            table.foreign(['tenant', 'parent_type_id']).references(['tenant', 'type_id']).inTable('asset_types');
            
            // Enable RLS
            table.checkValid();
        })
        .createTable('assets', table => {
            table.uuid('tenant').notNullable().references('tenant_id').inTable('tenants');
            table.uuid('asset_id').defaultTo(knex.raw('gen_random_uuid()')).notNullable();
            table.uuid('type_id').notNullable();
            table.uuid('company_id').notNullable();
            table.text('asset_tag').notNullable();
            table.text('serial_number');
            table.text('name').notNullable();
            table.text('status').notNullable();
            table.text('location');
            table.date('purchase_date');
            table.date('warranty_end_date');
            table.jsonb('attributes');
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            
            table.primary(['tenant', 'asset_id']);
            table.foreign(['tenant', 'type_id']).references(['tenant', 'type_id']).inTable('asset_types');
            table.foreign(['tenant', 'company_id']).references(['tenant', 'company_id']).inTable('companies');
            
            // Enable RLS
            table.checkValid();
        })
        .createTable('asset_history', table => {
            table.uuid('tenant').notNullable().references('tenant_id').inTable('tenants');
            table.uuid('history_id').defaultTo(knex.raw('gen_random_uuid()')).notNullable();
            table.uuid('asset_id').notNullable();
            table.uuid('changed_by').notNullable();
            table.text('change_type').notNullable();
            table.jsonb('changes').notNullable();
            table.timestamp('changed_at').defaultTo(knex.fn.now());
            
            table.primary(['tenant', 'history_id']);
            table.foreign(['tenant', 'asset_id']).references(['tenant', 'asset_id']).inTable('assets');
            table.foreign(['tenant', 'changed_by']).references(['tenant', 'user_id']).inTable('users');
            
            // Enable RLS
            table.checkValid();
        })
        .raw(`
            -- RLS Policies for asset_types
            ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
            CREATE POLICY tenant_isolation_policy ON asset_types
                USING (tenant = current_setting('app.current_tenant')::uuid);
            
            -- RLS Policies for assets
            ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
            CREATE POLICY tenant_isolation_policy ON assets
                USING (tenant = current_setting('app.current_tenant')::uuid);
            
            -- RLS Policies for asset_history
            ALTER TABLE asset_history ENABLE ROW LEVEL SECURITY;
            CREATE POLICY tenant_isolation_policy ON asset_history
                USING (tenant = current_setting('app.current_tenant')::uuid);
        `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .raw(`
            DROP POLICY IF EXISTS tenant_isolation_policy ON asset_history;
            DROP POLICY IF EXISTS tenant_isolation_policy ON assets;
            DROP POLICY IF EXISTS tenant_isolation_policy ON asset_types;
        `)
        .dropTableIfExists('asset_history')
        .dropTableIfExists('assets')
        .dropTableIfExists('asset_types');
};
