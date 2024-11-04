/** @type {import('next').NextConfig} */
import process from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';
import console from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['knex'],
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    // Disable webpack cache
    config.cache = false;
    
    // Add support for importing from ee/server/src using absolute paths
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@ee': process.env.NEXT_PUBLIC_EDITION === 'enterprise' 
          ? path.join(__dirname, '../ee/server/src/app')
          : false,
      },
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    };
    
    return config;
  },
  env: {
    EDITION: process.env.NEXT_PUBLIC_EDITION,
  },
}

export default nextConfig;
