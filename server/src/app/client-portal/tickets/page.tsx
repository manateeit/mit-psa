'use client';

import { Suspense } from 'react';
import { TicketList } from '@/components/client-portal/tickets/TicketList';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TicketsPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TicketList />
      </Suspense>
    </div>
  );
}
