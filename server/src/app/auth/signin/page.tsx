"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useRegisterUIComponent } from '../../../types/ui-reflection/useRegisterUIComponent';
import { ContainerComponent, CardComponent, DialogComponent, FormComponent, ButtonComponent, FormFieldComponent } from '../../../types/ui-reflection/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'server/src/components/ui/Card';
import MspLoginForm from 'server/src/components/auth/MspLoginForm';
import ClientLoginForm from 'server/src/components/auth/ClientLoginForm';
import RegisterForm from 'server/src/components/auth/RegisterForm';
import TwoFactorInput from 'server/src/components/auth/TwoFA';
import Alert from 'server/src/components/auth/Alert';
import { AlertProps } from 'server/src/interfaces';

export default function SignIn() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertProps>({ type: 'success', title: '', message: '' });
  const [isOpen2FA, setIsOpen2FA] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const searchParams = useSearchParams();

  const callbackUrl = searchParams?.get('callbackUrl') || '';
  const isClientPortal = callbackUrl.includes('/client-portal');
  const error = searchParams?.get('error');
  const registered = searchParams?.get('registered');

  // Register the page container
  const updatePage = useRegisterUIComponent<ContainerComponent>({
    id: 'signin-page',
    type: 'container',
    label: isClientPortal ? 'Client Portal Login' : 'MSP Login'
  });

  // Register alert dialog
  const updateAlert = useRegisterUIComponent<DialogComponent>({
    id: 'signin-alert',
    type: 'dialog',
    title: alertInfo.title,
    open: isAlertOpen,
    parentId: 'signin-page'
  });

  // Register 2FA dialog
  const update2FA = useRegisterUIComponent<DialogComponent>({
    id: 'signin-2fa',
    type: 'dialog',
    title: '2FA Verification',
    open: isOpen2FA,
    parentId: 'signin-page'
  });

  // Register 2FA close button
  const update2FACloseButton = useRegisterUIComponent<ButtonComponent>({
    id: 'signin-2fa-close-button',
    type: 'button',
    label: 'Close 2FA Dialog',
    parentId: 'signin-2fa',
    actions: ['click']
  });

  // Register main card
  const updateCard = useRegisterUIComponent<CardComponent>({
    id: 'signin-card',
    type: 'card',
    label: isClientPortal ? 
      (showRegister ? 'Create Account' : 'Client Portal Login') : 
      'MSP Dashboard Login',
    parentId: 'signin-page'
  });

  // Handle error and success messages from URL parameters
  useEffect(() => {
    if (error === 'AccessDenied') {
      setAlertInfo({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to access this page.'
      });
      setIsAlertOpen(true);
    } else if (registered === 'true') {
      setAlertInfo({
        type: 'success',
        title: 'Registration Successful',
        message: 'Your account has been created. Please sign in.'
      });
      setIsAlertOpen(true);
    }
  }, [error, registered]);

  // Update component states when they change
  useEffect(() => {
    updateAlert({ 
      open: isAlertOpen,
      title: alertInfo.title
    });
    
    update2FA({ 
      open: isOpen2FA 
    });

    // Update 2FA close button state
    update2FACloseButton({
      label: 'Close 2FA Dialog',
      disabled: !isOpen2FA
    });

    updateCard({
      label: isClientPortal ? 
        (showRegister ? 'Create Account' : 'Client Portal Login') : 
        'MSP Dashboard Login'
    });
  }, [
    isAlertOpen, alertInfo, isOpen2FA, showRegister, isClientPortal,
    updateAlert, update2FA, update2FACloseButton, updateCard
  ]);

  const handle2FA = (twoFactorCode: string) => {
    setIsOpen2FA(false);
    // Re-attempt sign in with 2FA code
    // This will be handled by the respective form components
  };

  const handleError = (error: AlertProps | string) => {
    if (typeof error === 'string') {
      setAlertInfo({
        type: 'error',
        title: 'Error',
        message: error
      });
    } else {
      setAlertInfo(error);
    }
    setIsAlertOpen(true);
  };

  // Initialize page state once at component mount
  useEffect(() => {
    updatePage({
      label: isClientPortal ? 'Client Portal Login' : 'MSP Login',
      children: []
    });
  }, [isClientPortal, updatePage]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <TwoFactorInput
        isOpen={isOpen2FA}
        onClose={() => setIsOpen2FA(false)}
        onComplete={handle2FA}
      />

      <Alert
        type={alertInfo.type}
        title={alertInfo.title}
        message={alertInfo.message}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />

      {/* Logo and text in top left corner */}
      <div className="absolute top-4 left-8 flex items-center">
        <Image
          src="/images/avatar-purple-background.png"
          alt="Logo"
          width={50}
          height={50}
          className="rounded-full mr-4"
        />
        <span className="text-lg font-semibold text-gray-800">
          {isClientPortal ? 'Client Portal' : 'Manatee IT PSA Platform'}
        </span>
      </div>

      {/* Left side with testimonial - only show for MSP login */}
      {!isClientPortal && (
        <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-center items-center">
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold mb-6">
              We&apos;ve been using Alga to give us suggestions of every ticket and can&apos;t imagine working without it.
            </h2>
            <div className="flex flex-col items-center mt-8">
              <Image
                src="/images/music.png"
                alt="Pippa Wilkinson"
                width={64}
                height={64}
                className="rounded-full"
              />
              <p className="mt-4 font-semibold">Pippa Wilkinson</p>
              <p className="text-sm text-gray-500">Head of Technician, Layers</p>
              <div className="flex mt-2">
                {[...Array(5)].map((_, i): JSX.Element => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right side with SignIn/Register form */}
      <div className={`w-full ${isClientPortal ? '' : 'lg:w-1/2'} flex items-center justify-center`}>
        <Card className="max-w-md w-full m-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isClientPortal ? (
                showRegister ? 'Create Account' : 'Client Portal Login'
              ) : (
                'MSP Dashboard Login'
              )}
            </CardTitle>
            <CardDescription>
              {isClientPortal ? (
                showRegister ?
                  'Create your account to access the client portal.' :
                  'Please enter your credentials to access the client portal.'
              ) : (
                'Welcome back! Please enter your details.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isClientPortal ? (
              showRegister ? (
                <>
                  <RegisterForm />
                  <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      onClick={() => setShowRegister(false)}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Sign in
                    </button>
                  </p>
                </>
              ) : (
                <ClientLoginForm
                  callbackUrl={callbackUrl}
                  onError={handleError}
                  onTwoFactorRequired={() => setIsOpen2FA(true)}
                  onRegister={() => setShowRegister(true)}
                />
              )
            ) : (
              <MspLoginForm
                callbackUrl={callbackUrl}
                onError={handleError}
                onTwoFactorRequired={() => setIsOpen2FA(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
