// server/src/app/msp/account-manager/page.tsx

import AccountManagerDashboard from '@/components/AccountManagerDashboard';
import Company from '@/lib/models/company';
import { ICompany } from '@/interfaces/company.interfaces';

export default async function AccountManagerPage() {
  // const companies = await Company.getAll();

  return <AccountManagerDashboard companies={[]} />;
}
