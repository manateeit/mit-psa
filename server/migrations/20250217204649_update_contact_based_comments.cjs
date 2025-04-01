const { getCommentTenants } = require('./20250217204647_get_comment_tenants.cjs');

exports.up = async function(knex) {
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'citus'
      ) THEN
        EXECUTE 'SET citus.multi_shard_modify_mode TO ''sequential''';
      END IF;
    END $$;
  `);
  await knex.transaction(async (trx) => {
    const tenants = await getCommentTenants(knex);

    // Process each tenant separately to maintain proper sharding
    for (const tenant of tenants) {
      // Get comments with contact info for this tenant
      // --- Query Commented Out: Relies on c.contact_id which was dropped in a previous migration ---
      /*
      const contactComments = await knex('comments as c')
        .select('c.comment_id', 'c.contact_id', 'c.tenant', 'u.user_id') // c.contact_id does not exist
        .leftJoin('users as u', function() {
          this.on('u.contact_id', '=', 'c.contact_id') // c.contact_id does not exist
              .andOn('u.tenant', '=', 'c.tenant');
        })
        .where('c.tenant', tenant)
        .andWhere('u.user_type', 'client')

      // Update contact-based comments
      for (const comment of contactComments) {
        if (!comment.contact_id) continue; // c.contact_id does not exist
        await knex('comments')
          .where('comment_id', comment.comment_id)
          .andWhere('tenant', tenant)
          .update({
            user_id: comment.user_id, // This might be incorrect if user_id wasn't populated before contact_id drop
            author_type: 'client' // This was likely handled by migration 20250217202724
          });
      }
      */
      // --- End Commented Out Block ---
      console.log(`Skipping potentially redundant contact-based comment update for tenant ${tenant} in migration 20250217204649 as contact_id column no longer exists.`);
    }
  });
};

exports.down = async function(knex) {
  // No need for down migration as the data changes are handled
  // in the column changes migration's down function
};

exports.config = { transaction: false };
