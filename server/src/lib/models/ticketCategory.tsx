import { createTenantKnex } from '@/lib/db';
import { ITicketCategory } from '@/interfaces/ticket.interfaces';

const TicketCategory = {
  getAll: async (): Promise<ITicketCategory[]> => {
    try {
      const { knex: db } = await createTenantKnex();
      // RLS will automatically filter categories based on the current user's tenant
      const categories = await db<ITicketCategory>('categories').select('*');
      return categories;
    } catch (error) {
      console.error('Error getting all ticket categories:', error);
      throw error;
    }
  },

  get: async (id: string): Promise<ITicketCategory> => {
    const { knex: db } = await createTenantKnex();
    // RLS will ensure that only categories from the current user's tenant are accessible
    const [category] = await db<ITicketCategory>('categories')
      .where('category_id', id);
    return category;
  },

  getByChannel: async (channelId: string): Promise<ITicketCategory[]> => {
    try {
      const { knex: db } = await createTenantKnex();
      const categories = await db<ITicketCategory>('categories')
        .where('channel_id', channelId);
      return categories;
    } catch (error) {
      console.error('Error getting ticket categories by channel:', error);
      throw error;
    }
  },

  insert: async (category: Partial<ITicketCategory>): Promise<ITicketCategory> => {
    try {
      const { knex: db, tenant } = await createTenantKnex();
      
      // Check if category with same name exists in the channel
      const existingCategory = await db('categories')
        .where({
          tenant,
          category_name: category.category_name,
          channel_id: category.channel_id
        })
        .first();

      if (existingCategory) {
        throw new Error('A ticket category with this name already exists in this channel');
      }

      // RLS will automatically set the tenant for the new category
      const [insertedCategory] = await db<ITicketCategory>('categories')
        .insert({ ...category, tenant: tenant! })
        .returning('*');
      return insertedCategory;
    } catch (error) {
      console.error('Error inserting ticket category:', error);
      throw error;
    }
  },

  update: async (id: string, category: Partial<ITicketCategory>): Promise<ITicketCategory> => {
    try {
      const { knex: db, tenant } = await createTenantKnex();

      // If name is being updated, check for duplicates in the same channel
      if (category.category_name) {
        const existingCategory = await db('categories')
          .where({
            tenant,
            category_name: category.category_name,
            channel_id: category.channel_id || (await db('categories').where({ category_id: id }).first()).channel_id
          })
          .whereNot('category_id', id)
          .first();

        if (existingCategory) {
          throw new Error('A ticket category with this name already exists in this channel');
        }
      }

      // RLS will ensure that only categories from the current user's tenant can be updated
      const [updatedCategory] = await db<ITicketCategory>('categories')
        .where({ category_id: id })
        .update(category)
        .returning('*');
      return updatedCategory;
    } catch (error) {
      console.error(`Error updating ticket category with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { knex: db, tenant } = await createTenantKnex();

      // Check if category has subcategories
      const hasSubcategories = await db('categories')
        .where({
          tenant,
          parent_category: id
        })
        .first();

      if (hasSubcategories) {
        throw new Error('Cannot delete ticket category that has subcategories');
      }

      // Check if category is in use by tickets
      const inUseCount = await db('tickets')
        .where({
          tenant,
          category_id: id
        })
        .orWhere({
          tenant,
          subcategory_id: id
        })
        .count('ticket_id as count')
        .first();

      if (inUseCount && Number(inUseCount.count) > 0) {
        throw new Error('Cannot delete ticket category that is in use by tickets');
      }

      // RLS will ensure that only categories from the current user's tenant can be deleted
      await db<ITicketCategory>('categories')
        .where({ category_id: id })
        .del();
    } catch (error) {
      console.error(`Error deleting ticket category with id ${id}:`, error);
      throw error;
    }
  },
};

export default TicketCategory;
