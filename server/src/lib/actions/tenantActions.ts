'use server'

import { getTenantForCurrentRequest } from '../tenant';

export async function getCurrentTenant(): Promise<string | null> {
  try {
    return await getTenantForCurrentRequest();
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    throw new Error('Failed to fetch tenant');
  }
}
