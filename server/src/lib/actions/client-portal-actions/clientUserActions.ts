'use server';

import { createTenantKnex } from '@/lib/db';
import { hashPassword } from '@/utils/encryption/encryption'; // Ensure you have this utility

/**
 * Create a client user 
 */
export async function createClientUser({
  email,
  password,
  contactId,
  companyId
}: {
  email: string;
  password: string;
  contactId: string;
  companyId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get or create the appropriate client role
    const clientRole = await knex('roles')
      .where({ name: 'Client', tenant })
      .first();

    if (!clientRole) {
      throw new Error('Client role not found');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const [user] = await knex('users')
      .insert({
        tenant,
        email,
        password: hashedPassword,
        contact_id: contactId,
        user_type: 'client',
        is_inactive: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning('*');

    // Assign the client role
    await knex('user_roles')
      .insert({
        user_id: user.user_id,
        role_id: clientRole.role_id,
        tenant
      });

    return { success: true };
  } catch (error) {
    console.error('Error creating client user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}