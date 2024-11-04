import { createTenantKnex } from '@/lib/db';
import { IRole } from '../../interfaces/auth.interfaces';
import logger from '../../utils/logger';

const Role = {
  getAllRoles: async (): Promise<IRole[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const roles = await db<IRole>('roles').select('*');
      return roles;
    } catch (error) {
      logger.error('Error getting all roles:', error);
      throw error;
    }
  },
};

export default Role;
