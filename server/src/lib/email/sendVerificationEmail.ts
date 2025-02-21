'use server'

import { createTenantKnex } from '@/lib/db';
import { getEmailNotificationService } from '@/lib/notifications/email';

interface SendVerificationEmailParams {
  email: string;
  token: string;
  registrationId: string;
}

export async function sendVerificationEmail({ 
  email, 
  token, 
  registrationId 
}: SendVerificationEmailParams): Promise<boolean> {
  try {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) throw new Error('Tenant is required');

    // Get company info for branding
    const company = await knex('companies')
      .where({ tenant })
      .select('company_name', 'company_logo_url', 'support_email')
      .first();

    if (!company) {
      throw new Error('Company not found');
    }

    // Get the base URL from environment variable or default to localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify?token=${token}&registrationId=${registrationId}`;

    // Get notification service
    const notificationService = getEmailNotificationService();

    // Send email using notification system
    await notificationService.sendNotification({
      tenant,
      userId: registrationId, // Use registration ID as temporary user ID
      subtypeId: await getVerificationSubtypeId(tenant),
      emailAddress: email,
      templateName: 'email-verification',
      data: {
        companyName: company.company_name,
        companyLogoUrl: company.company_logo_url,
        email,
        verificationUrl,
        supportEmail: company.support_email || 'support@example.com',
        currentYear: new Date().getFullYear()
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Helper to get verification subtype ID
async function getVerificationSubtypeId(tenant: string): Promise<number> {
  const { knex } = await createTenantKnex();
  
  const subtype = await knex('notification_subtypes')
    .join('notification_categories', 'notification_subtypes.category_id', 'notification_categories.id')
    .where({ 
      'notification_categories.name': 'Registration',
      'notification_subtypes.name': 'email-verification'
    })
    .select('notification_subtypes.id')
    .first();

  if (!subtype) {
    throw new Error('Email verification notification subtype not found');
  }

  return subtype.id;
}
