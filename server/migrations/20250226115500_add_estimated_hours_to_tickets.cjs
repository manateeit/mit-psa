exports.up = function(knex) {
  return knex.schema.alterTable('tickets', function(table) {
    table.bigInteger('estimated_hours').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tickets', function(table) {
    table.dropColumn('estimated_hours');
  });
};
