'use server'

import { IPriority } from '@/interfaces';
import Priority from '@/lib/models/priority';

export async function getAllPriorities() {
  try {
    const priorities = await Priority.getAll();
    return priorities;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch priorities');
  }
}

export async function findPriorityById(id: string) {
  try {
    const priority = await Priority.get(id);
    return priority;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to find priority');
  }
}

export async function createPriority(priorityData: Omit<IPriority, 'priority_id' | 'tenant'>): Promise<IPriority> {
  try {
    const newPriority = await Priority.insert(priorityData);
    return newPriority;
  } catch (error) {
    console.error('Error creating new priority:', error);
    throw new Error('Failed to create new priority');
  }
}


export async function deletePriority(priorityId: string) {
  try {
    await Priority.delete(priorityId);
    return true;
  } catch (error) {
    console.error('Error deleting priority:', error);
    throw new Error('Failed to delete priority');
  }
}

export async function updatePriority(priorityId: string, priorityData: Partial<IPriority>): Promise<IPriority> {
  try {
    const updatedPriority = await Priority.update(priorityId, priorityData);
    if (!updatedPriority) {
      throw new Error('Priority not found');
    }
    return updatedPriority;
  } catch (error) {
    console.error('Error updating priority:', error);
    throw new Error('Failed to update priority');
  }
}