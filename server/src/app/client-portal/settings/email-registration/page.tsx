'use client';

import EmailRegistrationContainer from '@/components/client-portal/settings/EmailRegistrationContainer';

export const metadata = {
  title: 'Email Registration Settings',
  description: 'Configure email domains that can self-register for client access',
};

export default function EmailRegistrationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Email Registration Settings</h1>
        <p className="text-gray-600">
          Configure which email domains can self-register for client access.
        </p>
      </div>
      <EmailRegistrationContainer />
    </div>
  );
}
