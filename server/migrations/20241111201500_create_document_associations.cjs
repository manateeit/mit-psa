exports.up = function(knex) {
  return knex.schema
    // Create document_associations table
    .createTable('document_associations', function(table) {
      table.uuid('association_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('document_id').notNullable();
      table.uuid('tenant').notNullable();
      table.uuid('entity_id').notNullable();
      table.string('entity_type').notNullable(); // 'ticket', 'company', 'contact', 'schedule'
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Foreign key to documents using composite key
      table.foreign(['tenant', 'document_id'])
        .references(['tenant', 'document_id'])
        .inTable('documents')
        .onDelete('CASCADE');
      
      // Composite unique constraint to prevent duplicate associations
      table.unique(['tenant', 'document_id', 'entity_id', 'entity_type']);
    })
    .raw(`
      ALTER TABLE document_associations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY tenant_isolation_policy ON document_associations
        USING (tenant = current_setting('app.current_tenant')::uuid);
        
      CREATE POLICY tenant_isolation_insert_policy ON document_associations
        FOR INSERT WITH CHECK (tenant = current_setting('app.current_tenant')::uuid);
    `);
};

exports.down = function(knex) {
  return knex.schema.dropTable('document_associations');
};
