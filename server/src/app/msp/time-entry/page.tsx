import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import TimeTracking from '@/components/time-management/TimeTracking';
import { redirect } from 'next/navigation';
import { findUserById } from '@/lib/actions/user-actions/userActions';
import { getTeams } from '@/lib/actions/team-actions/teamActions';

export default async function TimeTrackingPage() {
  const session = await getServerSession(options);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const user = await findUserById(session.user.id);

  if (!user) {
    throw new Error("User not found");
  }

  const teams = await getTeams();
  const isManager = teams.some(team => team.manager_id === user.user_id);

  return <TimeTracking currentUser={user} isManager={isManager} />;
}