'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getUserCompanyId } from '@/lib/actions/user-actions/userActions';
import { getCompanyEmailSettings } from '@/lib/actions/company-settings/emailSettings';
import { ICompanyEmailSettings } from '@/interfaces/company.interfaces';
import EmailRegistrationSettings from './EmailRegistrationSettings';

export default function EmailRegistrationContainer() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [emailSettings, setEmailSettings] = useState<ICompanyEmailSettings[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/signin');
          return;
        }

        // Get company ID
        const userCompanyId = await getUserCompanyId(user.user_id);
        if (!userCompanyId) {
          setError('Company not found');
          return;
        }

        setCompanyId(userCompanyId);

        // Load email settings
        const settings = await getCompanyEmailSettings(userCompanyId);
        setEmailSettings(settings);
      } catch (error) {
        console.error('Error loading email settings:', error);
        setError('Failed to load email registration settings');
      }
    }

    loadData();
  }, [router]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <EmailRegistrationSettings
      companyId={companyId}
      initialSuffixes={emailSettings}
    />
  );
}
