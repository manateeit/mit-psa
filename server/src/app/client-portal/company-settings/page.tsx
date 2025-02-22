import EmailRegistrationContainer from '@/components/client-portal/settings/EmailRegistrationContainer';

export default function CompanySettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Company Settings</h1>
        <p className="text-gray-600">
          Manage your company settings and configurations.
        </p>
      </div>

      {/* Email Registration Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Email Registration</h2>
        <EmailRegistrationContainer />
      </div>

      {/* Additional sections will be added here */}
    </div>
  );
}
