"use client";
import React from 'react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

const PasswordResetConfirmation: React.FC = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/auth/signin'); 
  };

  return (
    <div className="flex flex-col items-center p-20 min-h-screen bg-white">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <div>
          <Image
            src="/images/avatar-purple-background.png"
            alt="Logo"
            width={60}
            height={60}
            className="mx-auto rounded-full"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Password reset</h2>
        <p className="text-sm text-gray-600">
          Your password has been successfully reset.
          <br />
          Click below to log in magically.
        </p>
        <button
          onClick={handleContinue}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PasswordResetConfirmation;