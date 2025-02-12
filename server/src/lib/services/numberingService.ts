import { getConnection } from '@/lib/db/db';
import type { Knex } from 'knex';

export class NumberingService {
  async getNextTicketNumber(tenantId: string): Promise<string> {
    const knex = await getConnection(tenantId);
    try {
      // Use a prepared statement for better performance
      const result = await knex.raw('SELECT generate_next_number(?::uuid, ?::text) as number', [tenantId, 'TICKET']);
      const number = result?.rows?.[0]?.number;
      
      if (!number) {
        throw new Error(`Failed to generate ticket number for tenant ${tenantId}`);
      }

      return number;
    } catch (error: unknown) {
      console.error('Error generating ticket number:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate ticket number: ${error.message}`);
      }
      throw new Error('Failed to generate ticket number: Unknown error');
    }
  }
}
