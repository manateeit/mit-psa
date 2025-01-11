import { registerTicketEmailSubscriber, unregisterTicketEmailSubscriber } from './ticketEmailSubscriber';
import { registerProjectEmailSubscriber, unregisterProjectEmailSubscriber } from './projectEmailSubscriber';

export async function registerAllSubscribers(): Promise<void> {
  await registerTicketEmailSubscriber();
  await registerProjectEmailSubscriber();
}

export async function unregisterAllSubscribers(): Promise<void> {
  await unregisterTicketEmailSubscriber();
  await unregisterProjectEmailSubscriber();
}
