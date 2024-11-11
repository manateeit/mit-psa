/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function createDatabase(retryCount = 0) {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER_ADMIN,
    password: process.env.DB_PASSWORD_ADMIN,
    database: 'postgres' // Connect to the default postgres database
  });

  try {
    await client.connect();

    // Check if the database already exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME_SERVER]
    );

    if (dbCheckResult.rows.length > 0) {
      console.log(`Database ${process.env.DB_NAME_SERVER} already exists. Skipping creation.`);
    } else {
      // Create the database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME_SERVER}`);
      console.log(`Database ${process.env.DB_NAME_SERVER} created successfully.`);
    }

    // Check if the user already exists
    const userCheckResult = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [process.env.DB_USER_SERVER]
    );

    if (userCheckResult.rows.length > 0) {
      console.log(`User ${process.env.DB_USER_SERVER} already exists. Skipping creation.`);
    } else {
      // Create the user
      await client.query(`CREATE USER ${process.env.DB_USER_SERVER} WITH PASSWORD '${process.env.DB_PASSWORD_SERVER}'`);
      console.log(`User ${process.env.DB_USER_SERVER} created successfully.`);
    }

    // Set environment and grant privileges
    await client.query(`ALTER DATABASE ${process.env.DB_NAME_SERVER} SET app.environment = '${process.env.APP_ENV}'`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${process.env.DB_NAME_SERVER} TO ${process.env.DB_USER_SERVER}`);
    
    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error during database setup:', err);
    
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      await createDatabase(retryCount + 1);
    } else {
      console.error('Max retries reached. Database setup failed.');
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
