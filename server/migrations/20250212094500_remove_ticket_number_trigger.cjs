exports.up = async function(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trigger_set_ticket_number ON tickets');
  await knex.raw('DROP FUNCTION IF EXISTS set_ticket_number()');
};

exports.down = function() {
  throw new Error('Irreversible migration');
};
