'use client';

import { Suspense } from 'react';
import { TicketList } from '@/components/client-portal/tickets/TicketList';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TicketsPage() {
  return (
    <div className="container mx-auto px-2 py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600">View and manage your support tickets</p>
      </div>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TicketList />
      </Suspense>
    </div>
  );
}
