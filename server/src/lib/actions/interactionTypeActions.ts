// src/lib/actions/interactionTypeActions.ts

'use server'

import { IInteractionType } from '@/interfaces/interaction.interfaces';
import { createTenantKnex } from '@/lib/db';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';

export async function getAllInteractionTypes(): Promise<IInteractionType[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {knex: db} = await createTenantKnex();
    return await db('interaction_types')
      .where({ tenant: currentUser.tenant })
      .select('*');
  } catch (error) {
    console.error('Error fetching interaction types:', error);
    throw new Error('Failed to fetch interaction types');
  }
}

export async function createInteractionType(interactionType: Omit<IInteractionType, 'type_id' | 'tenant'>): Promise<IInteractionType> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {knex: db} = await createTenantKnex();
    const [newType] = await db('interaction_types').insert({
      ...interactionType,
      tenant: currentUser.tenant
    }).returning('*');
    return newType;
  } catch (error) {
    console.error('Error creating interaction type:', error);
    throw new Error('Failed to create interaction type');
  }
}

export async function updateInteractionType(typeId: string, data: Partial<IInteractionType>): Promise<IInteractionType> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {knex: db} = await createTenantKnex();
    const [updatedType] = await db('interaction_types')
      .where({ type_id: typeId, tenant: currentUser.tenant })
      .update(data)
      .returning('*');

    if (!updatedType) {
      throw new Error('Interaction type not found or not authorized');
    }

    return updatedType;
  } catch (error) {
    console.error('Error updating interaction type:', error);
    throw new Error('Failed to update interaction type');
  }
}

export async function deleteInteractionType(typeId: string): Promise<void> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {knex: db} = await createTenantKnex();
    const deletedCount = await db('interaction_types')
      .where({ type_id: typeId, tenant: currentUser.tenant })
      .delete();

    if (deletedCount === 0) {
      throw new Error('Interaction type not found or not authorized');
    }
  } catch (error) {
    console.error('Error deleting interaction type:', error);
    throw new Error('Failed to delete interaction type');
  }
}

export async function getInteractionTypeById(typeId: string): Promise<IInteractionType | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const {knex: db} = await createTenantKnex();
    const [type] = await db('interaction_types')
      .where({ type_id: typeId, tenant: currentUser.tenant })
      .select('*');

    return type || null;
  } catch (error) {
    console.error('Error fetching interaction type:', error);
    throw new Error('Failed to fetch interaction type');
  }
}
