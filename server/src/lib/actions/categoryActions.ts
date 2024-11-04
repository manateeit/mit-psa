'use server'
import { createTenantKnex } from '@/lib/db';
import { IServiceCategory } from '@/interfaces/billing.interfaces';

export async function getServiceCategories(): Promise<IServiceCategory[]> {
  try {
    const {knex: db} = await createTenantKnex();
    const categories = await db('service_categories')
      .select('category_id', 'category_name', 'description');

    return categories;
  } catch (error) {
    console.error('Error fetching service categories:', error);
    throw new Error('Failed to fetch service categories');
  }
}
