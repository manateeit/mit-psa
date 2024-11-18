import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { options } from '../api/auth/[...nextauth]/options';
import CustomerPortalNav from './CustomerPortalNav';

interface CustomerPortalLayoutProps {
  children: ReactNode;
}

export default async function CustomerPortalLayout({ children }: CustomerPortalLayoutProps) {
  const session = await getServerSession(options);

  // Redirect to login if not authenticated or not a client user
  if (!session?.user?.user_type || session.user.user_type !== 'client') {
    redirect('/auth/signin?callbackUrl=/customer-portal/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerPortalNav userEmail={session.user.email} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
