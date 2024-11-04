'use client';

import { useRouter } from 'next/navigation';

interface BackNavProps {
  children: React.ReactNode;
}

export default function BackNav({ children }: BackNavProps) {
  const router = useRouter();
  
  return (
    <button
      type="button"
      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      onClick={() => router.back()}
    >
      {children}
    </button>
  );
}
