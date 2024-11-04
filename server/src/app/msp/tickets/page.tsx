import { getTicketsForList } from '@/lib/actions/ticket-actions/ticketActions';
import TicketingDashboard from '@/components/tickets/TicketingDashboard';
import { getServerSession } from "next-auth/next";
import User from '@/lib/models/user'
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';

export default async function TicketsPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userEmail = await getCurrentUser();
  console.log('DEBUG userEmail:', userEmail);
  const userId = userEmail?.user_id;
  
  if (!userId) {
    console.error('User ID is missing from the session');
    redirect('/auth/signin');
  }

  try {
    const user = await User.get(userId);
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      redirect('/auth/signin');
    }

    console.log('getting tickets');
    const tickets = await getTicketsForList(user, {
      channelFilterState: 'active'
    });
    return <TicketingDashboard initialTickets={tickets} user={user} />;
  } catch (error) {
    console.error('Error fetching user or tickets:', error);
    return <div>An error occurred. Please try again later.</div>;
  }
}
