exports.up = function(knex) {
  return knex.transaction(async (trx) => {
    // First update the enum type
    await trx.raw(`
      -- Drop the default constraint
      ALTER TABLE comments ALTER COLUMN author_type DROP DEFAULT;
      
      -- Rename old type and create new one
      ALTER TYPE comment_author_type RENAME TO comment_author_type_old;
      CREATE TYPE comment_author_type AS ENUM ('internal', 'client', 'unknown');
      
      -- Update column type with conversion
      ALTER TABLE comments 
        ALTER COLUMN author_type TYPE comment_author_type 
        USING CASE 
          WHEN author_type::text = 'user' THEN 'internal'::comment_author_type
          WHEN author_type::text = 'contact' THEN 'client'::comment_author_type
          ELSE 'unknown'::comment_author_type
        END;
      
      -- Set the new default
      ALTER TABLE comments ALTER COLUMN author_type SET DEFAULT 'unknown'::comment_author_type;
      
      -- Drop old type
      DROP TYPE comment_author_type_old;
    `);

    // Then get all comments with their users
    const commentsWithUsers = await trx('comments as c')
      .select('c.comment_id', 'c.tenant', 'c.user_id', 'u.user_type')
      .leftJoin('users as u', function() {
        this.on('c.user_id', '=', 'u.user_id')
            .andOn('c.tenant', '=', 'u.tenant');
      });

    // Update author_type based on user's type
    for (const comment of commentsWithUsers) {
      await trx('comments')
        .where('comment_id', comment.comment_id)
        .andWhere('tenant', comment.tenant)
        .update({
          author_type: comment.user_type === 'internal' ? 'internal' : 
                      comment.user_type === 'client' ? 'client' : 'unknown'
        });
    }

    // Get comments with contact info
    const contactComments = await trx('comments as c')
      .select('c.comment_id', 'c.tenant', 'u.user_id')
      .leftJoin('users as u', function() {
        this.on(function() {
          this.on('u.contact_id', '=', 'c.contact_id')
              .orOn('u.contact_id', '=', 'c.contact_name_id');
        }).andOn('c.tenant', '=', 'u.tenant');
      })
      .where('u.user_type', 'client')
      .whereNotNull('c.contact_id')
      .orWhereNotNull('c.contact_name_id');

    // Update contact-based comments
    for (const comment of contactComments) {
      await trx('comments')
        .where('comment_id', comment.comment_id)
        .andWhere('tenant', comment.tenant)
        .update({
          user_id: comment.user_id,
          author_type: 'client'
        });
    }

    // Set remaining comments to unknown
    await trx('comments')
      .whereNull('user_id')
      .orWhereNotIn('author_type', ['internal', 'client', 'unknown'])
      .update({
        author_type: 'unknown'
      });

    // Drop columns
    await trx.schema.alterTable('comments', function(table) {
      table.dropColumn('contact_id');
      table.dropColumn('contact_name_id');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('comments', function(table) {
    table.uuid('contact_id');
    table.uuid('contact_name_id');
  });
};
