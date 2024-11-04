import { createTenantKnex } from '../db';
import { IService } from '../../interfaces/billing.interfaces';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid package

const Service = {
  getAll: async (): Promise<IService[]> => {
    const {knex: db} = await createTenantKnex();
    return await db<IService>('service_catalog').select('*');
  },

  getById: async (service_id: string): Promise<IService | null> => {
    const {knex: db} = await createTenantKnex();
    const [service] = await db<IService>('service_catalog')
      .where({ service_id })
      .select('*');
    return service || null;
  },

  create: async (serviceData: Omit<IService, 'service_id' | 'tenant'>): Promise<IService> => {
    const {knex: db, tenant} = await createTenantKnex();
    
    console.log('[Service.create] Received serviceData:', serviceData);
    console.log('[Service.create] service_type value:', serviceData.service_type);
    
    // Explicitly construct the service object with required fields
    const newService = {
      service_id: uuidv4(),
      tenant: tenant!,
      service_name: serviceData.service_name,
      service_type: serviceData.service_type, // Required field
      default_rate: serviceData.default_rate,
      unit_of_measure: serviceData.unit_of_measure,
      category_id: serviceData.category_id || null,
      // Optional fields
      is_taxable: serviceData.is_taxable || false,
      tax_region: serviceData.tax_region || null
    };

    console.log('[Service.create] Constructed newService object:', newService);
    console.log('[Service.create] About to execute insert with service_type:', newService.service_type);

    try {
      const [createdService] = await db('service_catalog')
        .insert(newService)
        .returning('*');

      console.log('[Service.create] Successfully created service:', createdService);
      return createdService;
    } catch (error) {
      console.error('[Service.create] Database error:', error);
      throw error;
    }
  },

  update: async (service_id: string, serviceData: Partial<IService>): Promise<IService | null> => {
    const {knex: db} = await createTenantKnex();
    const [updatedService] = await db<IService>('service_catalog')
      .where({ service_id })
      .update(serviceData)
      .returning('*');
    return updatedService || null;
  },

  delete: async (service_id: string): Promise<boolean> => {
    const {knex: db} = await createTenantKnex();
    const deletedCount = await db<IService>('service_catalog')
      .where({ service_id })
      .del();
    return deletedCount > 0;
  },

  getByCategoryId: async (category_id: string): Promise<IService[]> => {
    const {knex: db} = await createTenantKnex();
    return await db<IService>('service_catalog')
      .where({ category_id: category_id })
      .select('*');
  },
};

export default Service;
