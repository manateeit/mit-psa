/**
 * Add verification email template to system_email_templates
 */
exports.up = async function(knex) {
  // Get or create registration category
  const [registrationCategory] = await knex('notification_categories')
    .insert({
      name: 'Registration',
      description: 'Account registration and verification notifications'
    })
    .onConflict('name')
    .merge()
    .returning('*');

  // Create notification subtype
  const [verificationSubtype] = await knex('notification_subtypes')
    .insert({
      category_id: registrationCategory.id,
      name: 'email-verification',
      description: 'Email verification for new registrations'
    })
    .onConflict('name')
    .merge()
    .returning('*');

  // Add system template following existing template patterns
  await knex('system_email_templates').insert({
    name: 'email-verification',
    notification_subtype_id: verificationSubtype.id,
    subject: 'Verify your email address for {{companyName}}',
    html_content: `
          <h2>Email Verification</h2>
          <div class="details">
            <p><strong>Company:</strong> {{companyName}}</p>
            <p><strong>Email:</strong> {{email}}</p>
          </div>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
          </div>
          <p>If the button doesn't work, you can also click this link:<br>
            <a href="{{verificationUrl}}">{{verificationUrl}}</a>
          </p>
          <p>This verification link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't request this email, please ignore it or contact our support team at 
              <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>
            </p>
            <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
          </div>
    `,
    text_content: `
  Email Verification
  
  Thank you for registering with {{companyName}}.
  
  Company: {{companyName}}
  Email: {{email}}
  
  Please verify your email address by clicking the link below:
  {{verificationUrl}}
  
  This verification link will expire in 24 hours.
  
  If you didn't request this email, please ignore it or contact our support team at {{supportEmail}}
  
  © {{currentYear}} {{companyName}}. All rights reserved.
    `
  });
};

exports.down = async function(knex) {
  // Delete the template
  await knex('system_email_templates')
    .where({ name: 'email-verification' })
    .del();

  // Delete the subtype
  await knex('notification_subtypes')
    .where({ name: 'email-verification' })
    .del();

  // Check if registration category has other subtypes
  const subtypeCount = await knex('notification_subtypes')
    .where({ category_id: knex('notification_categories').where({ name: 'Registration' }).select('id') })
    .count('id as count')
    .first();

  // If no other subtypes, delete the category
  if (subtypeCount && Number(subtypeCount.count) === 0) {
    await knex('notification_categories')
      .where({ name: 'Registration' })
      .del();
  }
};
