import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/static/master_terms');
}
