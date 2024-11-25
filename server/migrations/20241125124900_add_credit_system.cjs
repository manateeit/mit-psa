/**
 * Run migration: npx knex migrate:up 20241125124900_add_credit_system.cjs --knexfile knexfile.cjs
 * Rollback: npx knex migrate:down 20241125124900_add_credit_system.cjs --knexfile knexfile.cjs
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('invoices', (table) => {
        table.unique(['invoice_id']);
    });
        
    await knex.schema.alterTable('companies', (table) => {
        table.decimal('credit_balance', 10, 2).defaultTo(0);
    });

    await knex.schema.createTable('transactions', (table) => {
        table.uuid('transaction_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('tenant').notNullable();
        table.uuid('company_id').notNullable();
        table.uuid('invoice_id').nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.enum('type', ['payment', 'credit', 'invoice_application']).notNullable();
        table.string('description').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.string('reference_number').nullable();
        table.string('status').defaultTo('completed');
        
        table.foreign('company_id').references('company_id').inTable('companies');
        table.foreign('invoice_id').references('invoice_id').inTable('invoices');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTable('transactions');
    await knex.schema.alterTable('companies', (table) => {
        table.dropColumn('credit_balance');
    });
};
