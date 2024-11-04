'use server'

import { Knex as KnexType } from 'knex';
import knexfile from '../../../knexfile';
import { getTenantForCurrentRequest, getTenantFromHeaders } from '../tenant';
import { getConnection } from './db';
import { headers } from 'next/headers';

interface TenantConnection {
    knex: KnexType;
    tenant?: string | null;
}

export async function createTenantKnex(): Promise<TenantConnection> {
    const environment = process.env.NODE_ENV === 'test' ? 'development' : (process.env.NODE_ENV || 'development');
    const config = knexfile[environment as keyof typeof knexfile] as KnexType.Config;
    if (!config) {
        throw new Error(`Invalid environment: ${environment}`);
    }

    try {
        // Try to get tenant from session
        const tenant = await getTenantForCurrentRequest();
        const knex = await getConnection(tenant);
        return { knex, tenant };

    } catch (error) {
        console.warn('Failed to get tenant from session, attempting to use headers');
        // If session fails, try to get tenant from headers
        const headersList = headers();
        const tenantFromHeaders = getTenantFromHeaders(headersList);
        
        if (tenantFromHeaders) {
            const knex = await getConnection(tenantFromHeaders);
            return { knex, tenant: tenantFromHeaders };
        }
        
        // If we still don't have a tenant, throw an error
        throw new Error('Unable to determine tenant for database connection');
    }
}