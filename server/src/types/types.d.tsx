import type { NextRequest } from 'next/server';

declare module 'next/server' {
  interface NextRequest {
    userId?: number;
    username?: string;
  }
}

interface TaxRegion {
  id: string;
  name: string;
}
// Add the ISO8601String type alias
type ISO8601String = string;

// Export the new type
// Export the new type
export type { ISO8601String, TaxRegion };
