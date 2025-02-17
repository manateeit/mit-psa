'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AvatarIcon from '@/components/ui/AvatarIcon';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import type { IUserWithRoles } from '@/types';

interface ClientPortalLayoutProps {
  children: ReactNode;
}

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const [userData, setUserData] = useState<IUserWithRoles | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getCurrentUser();      
      if (user) {
        setUserData(user);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-transparent shadow-[0_5px_10px_rgba(0,0,0,0.1)]">
        <div className="w-full px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/client-portal/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/avatar-purple-background.png"
                      alt="AlgaPSA Logo"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-lg font-semibold flex items-center">
                    <span className="text-[rgb(var(--color-text-900))]">Client Portal</span>
                  </span>
                </Link>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  href="/client-portal/dashboard" 
                  className="px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-900))] hover:text-[rgb(var(--color-primary-500))]"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/client-portal/tickets" 
                  className="px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-primary-500))]"
                >
                  Support Tickets
                </Link>
                <Link 
                  href="/client-portal/projects" 
                  className="px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-primary-500))]"
                >
                  Projects
                </Link>
                <Link 
                  href="/client-portal/billing" 
                  className="px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-primary-500))]"
                >
                  Billing
                </Link>
                <Link 
                  href="/client-portal/assets" 
                  className="px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-600))] hover:text-[rgb(var(--color-primary-500))]"
                >
                  Assets
                </Link>
              </div>
            </div>

            {/* Right side - Profile */}
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-[rgb(var(--color-text-600))] mr-3">
                    {userData?.email || ''}
                  </span>
                  <div className="relative">
                    <AvatarIcon 
                      userId={userData?.user_id || ''}
                      firstName={userData?.first_name || ''}
                      lastName={userData?.last_name || ''}
                      size="sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
