// globalSetup.js
import dotenv from 'dotenv';
import path from 'path';
import process from 'process';
import console from 'console';

export default function () {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Environment file path:', envPath);
  dotenv.config({ path: envPath });
}