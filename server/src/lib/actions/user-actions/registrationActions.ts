'use server'

import { createTenantKnex } from '@/lib/db';
import { hashPassword } from '@/utils/encryption/encryption';
import { verifyContactEmail } from '@/lib/actions/user-actions/userActions';
import { verifyEmailSuffix, getCompanyByEmailSuffix } from '@/lib/actions/company-settings/emailSettings';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email/sendVerificationEmail';
import { 
  checkRegistrationLimit, 
  checkVerificationLimit, 
  checkEmailLimit,
  formatRateLimitError,
  logSecurityEvent 
} from '@/lib/security/rateLimiting';

interface IRegistrationResult {
  success: boolean;
  error?: string;
  registrationId?: string;
}

interface IVerificationResult {
  success: boolean;
  error?: string;
  email?: string;
  registrationId?: string;
}

// Helper to generate secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Helper to get expiration timestamp
function getExpirationTime(hours: number = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

export async function initiateRegistration(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<IRegistrationResult> {
  const { knex, tenant } = await createTenantKnex();
  if (!tenant) throw new Error('Tenant is required');
  
  try {
    // Check rate limits first
    const rateLimitResult = await checkRegistrationLimit(email);
    if (!rateLimitResult.success) {
      const errorMessage = await formatRateLimitError(rateLimitResult.msBeforeNext);
      return { 
        success: false, 
        error: errorMessage
      };
    }

    // First try contact-based registration
    const contactVerification = await verifyContactEmail(email);
    
    if (contactVerification.exists && !contactVerification.isActive) {
      return { success: false, error: "This contact is inactive" };
    }
    
    if (contactVerification.exists) {
      // Proceed with contact-based registration
      const result = await registerContactUser(email, password);
      return { success: result.success, error: result.error };
    }
    
    // If not a contact, try email suffix registration
    const isValidSuffix = await verifyEmailSuffix(email);
    if (!isValidSuffix) {
      return { 
        success: false, 
        error: "Email domain not authorized for registration" 
      };
    }

    const companyIdResult = await getCompanyByEmailSuffix(email);
    if (!companyIdResult) {
      return { 
        success: false, 
        error: "Could not determine company for email domain" 
      };
    }
    const companyId = companyIdResult.toString();

    // Create pending registration
    const registrationId = uuid();
    const hashedPassword = await hashPassword(password);

    await knex('pending_registrations').insert({
      tenant,
      registration_id: registrationId,
      email: email.toLowerCase(),
      hashed_password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      company_id: companyId,
      status: 'PENDING_VERIFICATION',
      expires_at: getExpirationTime(),
      created_at: new Date().toISOString()
    });

    // Generate verification token
    const token = generateToken();
    const [verificationToken] = await knex('verification_tokens').insert({
      tenant,
      token_id: uuid(),
      registration_id: registrationId,
      company_id: companyId,
      token,
      expires_at: getExpirationTime(),
      created_at: new Date().toISOString()
    }).returning('*');

    // Check email sending rate limit
    const emailLimitResult = await checkEmailLimit(email);
    if (!emailLimitResult.success) {
      const errorMessage = await formatRateLimitError(emailLimitResult.msBeforeNext);
      return { 
        success: false, 
        error: errorMessage
      };
    }

    // Send verification email
    try {
      await sendVerificationEmail({
        email,
        token,
        registrationId
      });
    } catch (error) {
      // If email fails to send, clean up the registration and token
      await knex.transaction(async (trx) => {
      await trx('verification_tokens')
        .where({ token_id: verificationToken.token_id })
        .delete();
      await trx('pending_registrations')
        .where({ registration_id: registrationId })
        .delete();
      });
      return { 
        success: false, 
        error: 'Failed to send verification email' 
      };
    }

    return { 
      success: true,
      registrationId 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during registration' 
    };
  }
}

export async function verifyRegistrationToken(token: string): Promise<IVerificationResult> {
  const { knex, tenant } = await createTenantKnex();
  if (!tenant) throw new Error('Tenant is required');
  
  try {
    // Check verification rate limit
    const rateLimitResult = await checkVerificationLimit(token);
    if (!rateLimitResult.success) {
      const errorMessage = await formatRateLimitError(rateLimitResult.msBeforeNext);
      return { 
        success: false, 
        error: errorMessage
      };
    }

    // Get token record
    const verificationToken = await knex('verification_tokens')
      .where({ 
        tenant,
        token,
        used_at: null 
      })
      .where('expires_at', '>', new Date().toISOString())
      .first();

    if (!verificationToken) {
      return { 
        success: false, 
        error: 'Invalid or expired verification token' 
      };
    }

    // Get registration record
    const registration = await knex('pending_registrations')
      .where({ 
        tenant,
        registration_id: verificationToken.registration_id,
        status: 'PENDING_VERIFICATION'
      })
      .first();

    if (!registration) {
      return { 
        success: false, 
        error: 'Registration not found or already verified' 
      };
    }

    // Update token and registration status
    await knex.transaction(async (trx) => {
      await trx('verification_tokens')
        .where({ token_id: verificationToken.token_id })
        .update({ 
          used_at: new Date().toISOString() 
        });

      await trx('pending_registrations')
        .where({ registration_id: registration.registration_id })
        .update({ 
          status: 'VERIFIED',
          updated_at: new Date().toISOString()
        });
    });

    // Log successful verification
    await logSecurityEvent(tenant, 'email_verification_success', {
      email: registration.email,
      registrationId: registration.registration_id
    });

    return { 
      success: true,
      email: registration.email,
      registrationId: registration.registration_id
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during verification' 
    };
  }
}

export async function completeRegistration(registrationId: string): Promise<IRegistrationResult> {
  const { knex, tenant } = await createTenantKnex();
  if (!tenant) throw new Error('Tenant is required');
  
  try {
    // Get verified registration
    const registration = await knex('pending_registrations')
      .where({ 
        tenant,
        registration_id: registrationId,
        status: 'VERIFIED'
      })
      .first();

    if (!registration) {
      return { 
        success: false, 
        error: 'Registration not found or not verified' 
      };
    }

    // Create user
    const [user] = await knex('users')
      .insert({
        email: registration.email,
        username: registration.email,
        first_name: registration.first_name,
        last_name: registration.last_name,
        hashed_password: registration.hashed_password,
        tenant,
        user_type: 'client',
        is_inactive: false,
        created_at: new Date().toISOString()
      })
      .returning('*');

    // Check if this is the first user for the company
    const existingUsersResult = await knex('users')
      .where({ tenant })
      .whereIn('user_id', function() {
        this.select('user_id')
          .from('user_roles')
          .join('roles', 'user_roles.role_id', 'roles.role_id')
          .where({
            tenant,
            'roles.role_name': 'client_admin'
          });
      })
      .count('user_id as count')
      .first();

    // Get appropriate role (client_admin for first user, client for others)
    const roleName = (!existingUsersResult || existingUsersResult.count === '0') 
      ? 'client_admin' 
      : 'client';

    const role = await knex('roles')
      .where({ 
        tenant,
        role_name: roleName 
      })
      .first();

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    // Assign role
    await knex('user_roles').insert({
      tenant,
      user_id: user.user_id,
      role_id: role.role_id
    });

    // Update registration status
    await knex('pending_registrations')
      .where({ registration_id: registration.registration_id })
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      });

    // Log successful registration completion
    await logSecurityEvent(tenant, 'registration_completed', {
      userId: user.user_id,
      email: registration.email,
      registrationId: registration.registration_id
    });

    return { success: true };
  } catch (error) {
    console.error('Registration completion error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while completing registration' 
    };
  }
}

// Helper function for contact-based registration
async function registerContactUser(
  email: string, 
  password: string
): Promise<IRegistrationResult> {
  const { knex, tenant } = await createTenantKnex();
  if (!tenant) throw new Error('Tenant is required');
  
  try {
    // Get contact details
    const contact = await knex('contacts')
      .where({ email })
      .select('contact_name_id', 'company_id', 'is_inactive', 'full_name')
      .first();

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    if (contact.is_inactive) {
      return { success: false, error: 'Contact is inactive' };
    }

    // Check if user already exists
    const existingUser = await knex('users')
      .where({ email })
      .first();

    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Split full name
    const nameParts = contact.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user
    const hashedPassword = await hashPassword(password);
    const [user] = await knex('users')
      .insert({
        email,
        username: email,
        first_name: firstName,
        last_name: lastName,
        hashed_password: hashedPassword,
        tenant,
        user_type: 'client',
        contact_id: contact.contact_name_id,
        is_inactive: false,
        created_at: new Date().toISOString()
      })
      .returning('*');

    // Get client role
    const clientRole = await knex('roles')
      .where({ 
        tenant,
        role_name: 'client' 
      })
      .first();

    if (!clientRole) {
      throw new Error('Client role not found');
    }

    // Assign role
    await knex('user_roles').insert({
      tenant,
      user_id: user.user_id,
      role_id: clientRole.role_id
    });

    return { success: true };
  } catch (error) {
    console.error('Contact registration error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred during registration' 
    };
  }
}
