// server/src/components/layout/Body.tsx

import React from 'react';

export default function Body({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex-1 bg-gray-100  h-full overflow-y-auto scrollbar-hide">
      {children}
    </div>
  );
}