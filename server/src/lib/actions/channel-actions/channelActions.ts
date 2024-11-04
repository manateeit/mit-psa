'use server'

import { IChannel } from '../../../interfaces';
import Channel from '../../models/channel';

export async function findChannelById(id: string): Promise<IChannel | undefined> {
  try {
    const channel = await Channel.get(id);
    return channel;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to find channel');
  }
}

export async function getAllChannels(includeAll: boolean = true): Promise<IChannel[]> {
  try {
    const channels = await Channel.getAll(includeAll);
    return channels;
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    return [];
  }
}

export async function createChannel(channelData: Omit<IChannel, 'channel_id' | 'tenant'>): Promise<IChannel> {
  try {
    channelData.is_inactive = false;
    const newChannel = await Channel.insert(channelData);
    return newChannel;
  } catch (error) {
    console.error('Error creating new channel:', error);
    throw new Error('Failed to create new channel');
  }
}

export async function deleteChannel(channelId: string): Promise<boolean> {
  try {
    await Channel.delete(channelId);
    return true;
  } catch (error) {
    console.error('Error deleting channel:', error);
    throw new Error('Failed to delete channel');
  }
}

export async function updateChannel(channelId: string, channelData: Partial<Omit<IChannel, 'tenant'>>): Promise<IChannel> {
  try {
    const updatedChannel = await Channel.update(channelId, channelData);
    if (!updatedChannel) {
      throw new Error('Channel not found');
    }
    
    return updatedChannel;
  } catch (error) {
    console.error('Error updating channel:', error);
    throw new Error('Failed to update channel');
  }
}
