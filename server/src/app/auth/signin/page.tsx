"use client";
import { useState } from 'react'; 

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image'; 
import Link from 'next/link';

import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import { Checkbox, Text, Flex } from '@radix-ui/themes';
import * as Form from '@radix-ui/react-form'; 

import { have_two_factor_enabled } from '@/lib/actions/auth';
import TwoFactorInput from '@/components/auth/TwoFA'; 
import { AlertProps } from '@/interfaces';
import Alert from '@/components/auth/Alert';

const IS_PREMIUM = process.env.NEXT_PUBLIC_IS_PREMIUM === 'true';

export default function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<AlertProps>({ type: 'success', title: '', message: '' });



  const [isOpen2FA, setIsOpen2FA] = useState(false);

  const handle2FA= (twoFactorCode: string) => {
    console.log('Completed code:', twoFactorCode);
    setIsOpen2FA(false);
    authWithCredentials(password, email, twoFactorCode);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (await have_two_factor_enabled(password, email)) {
      await authWith2FA(password, email);
    } else {
      await authWithCredentials(password, email);
    }
  };

  const authWith2FA = async (password: string, email: string) => {
    setIsOpen2FA(true);
  }


  const authWithCredentials = async (password: string, email: string, twoFactorCode?: string) => {
      try {
        const auth_approach = IS_PREMIUM ? 'keycloak-credentials' : 'credentials';
        const result = await signIn(auth_approach, {
            redirect: false,
            email,
            password,
            twoFactorCode
          });
        if (result?.error) {
            console.error('Sign-in error:', result.error);
            setAlertInfo({ type: 'warning', title: 'Sign-in error', message: 'Please review yours credentials and try again' });
            setIsAlertOpen(true);
        } else {
            console.log('Sign-in successful, redirecting...');
            router.push('/msp');
        }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      setAlertInfo({ type: 'error', title: 'Error !!!', message: 'Unexpected error during sign-in' });
      setIsAlertOpen(true);
    }
  }


  const handleGoogleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const result = await signIn('google');
      if (!result) {
        console.error('Sign-in error:', 'User no found');
        setAlertInfo({ type: 'warning', title: 'Sign-in error', message: 'User no found' });
        setIsAlertOpen(true);
      } else {
          console.log('Sign-in successful, redirecting...');
          router.push('/msp');
      }
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
    }
  }





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
              alt="Pippa Wilkinson"
              width={50}
              height={50}
              className="rounded-full mr-4 "
            />
        <span className="text-lg font-semibold text-gray-800">AI-Enhanced PSA Platform for MSPs</span>
      </div>
      
      {/* Left side with testimonial */}
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
              {[...Array(5)].map((_, i):JSX.Element => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side with SignIn form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Welcome back! Please enter your details.</p>
          </div>
          <Form.Root className="mt-8 space-y-6">
            <div className="space-y-4">
              <Form.Field name="email">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <Form.Message className="FormMessage" match="valueMissing">
                    Please enter your email
                  </Form.Message>
                  <Form.Message className="FormMessage" match="typeMismatch">
                    Please provide a valid email
                  </Form.Message>
                </div>
                <Form.Control asChild>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  />
                </Form.Control>
              </Form.Field>
              <Form.Field name="password">
                <div className="relative">
                  <Form.Control asChild>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm pr-10"
                    />
                  </Form.Control>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOpenIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeClosedIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </Form.Field>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                
              <Text as="label" size="2">
                <Flex gap="2">
                  <Checkbox color="purple" defaultChecked />
                  Agree to Terms and Conditions
                </Flex>
              </Text>
              </div>
              <div className="text-sm">
                <Link href="/auth/forgot_password" className="font-medium text-purple-600 hover:text-purple-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Sign in
              </button>

            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"/>
                  <path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"/>
                  <path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"/>
                  <path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          </Form.Root>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-medium text-purple-600 hover:text-purple-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}