'use client';

import React from 'react';
import { NextPageContext } from 'next';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import Image from 'next/image';

interface ErrorProps {
    statusCode?: number;
  }
  

function Error({ statusCode }: ErrorProps) {
    const router = useRouter();
    console.log('error', statusCode);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-4">
            <div className="mb-8 w-32 h-32 rounded-full overflow-hidden">
                <Image
                    src="/images/avatar-purple-background.png" 
                    alt="404" 
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                />
            </div>
            <h2 className="text-1xl font-bold mb-8 text-purple-500">500 error</h2>
            <h1 className="text-4xl font-bold mb-4">Internal Server Error</h1>
            <p className="text-gray-600 mb-8 max-w-md">
            The server encountered an error could not complete your request.
            </p>
            <p className="text-gray-600 mb-8 max-w-md">
            If the problem persist, please report your problem and mention this error message and the query that caused it.
            </p>
            <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Go back
            </button>
        </div>
    );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;