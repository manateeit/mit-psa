'use client';

import { useState } from 'react';
import { DropdownMenu } from '@radix-ui/themes';
import { UserCircle, LogOut, Settings } from 'lucide-react';
import Image from 'next/image';
import SignOutDialog from '@/components/auth/SignOutDialog';

interface CustomerPortalNavProps {
  userEmail: string;
}

export default function CustomerPortalNav({ userEmail }: CustomerPortalNavProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Image
                  src="/images/avatar-purple-background.png"
                  alt="Logo"
                  width={50}
                  height={50}
                  className="rounded-full mr-4"
                />
                <span className="text-xl font-semibold">Customer Portal</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/customer-portal/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/customer-portal/tickets"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Support Tickets
                </a>
                <a
                  href="/customer-portal/billing"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Billing
                </a>
                <a
                  href="/customer-portal/assets"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Assets
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger>
                    <button className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none">
                      <UserCircle className="w-5 h-5" />
                      <span>{userEmail}</span>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end" className="mt-1 w-48">
                    <DropdownMenu.Item className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <a href="/customer-portal/account" className="flex items-center w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </a>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <button
                        onClick={() => setShowSignOutDialog(true)}
                        className="flex items-center w-full text-red-600 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SignOutDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
      />
    </>
  );
}
