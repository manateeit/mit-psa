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

    let tenant: string | null = null;

    // Try to get tenant from session first
    try {
        tenant = await getTenantForCurrentRequest();
    } catch (e) {
        console.warn('Failed to get tenant from session:', e);
    }

    // If no tenant from session, try headers
    if (!tenant) {
        try {
            const headersList = headers();
            tenant = getTenantFromHeaders(headersList);
        } catch (e) {
            console.warn('Failed to get tenant from headers:', e);
        }
    }

    // Get database connection
    try {
        const knex = await getConnection(tenant);
        return { knex, tenant };
    } catch (error) {
        console.error('Failed to create database connection:', error);
        throw new Error(`Failed to create database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
