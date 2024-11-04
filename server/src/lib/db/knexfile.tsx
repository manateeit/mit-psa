import { TKnexfile } from '@/types';
import { Knex } from 'knex';
import {  } from 'pg-types';
import { setTypeParser } from 'pg-types';
import dotenv from 'dotenv';

type Function = (err: Error | null, connection: Knex.Client) => void;

// Load test environment variables if we're in a test environment
if (process.env.NODE_ENV === 'test') {
  const result = dotenv.config({
    path: '.env.localtest'
  });
  console.log(result);
  if (result.parsed?.DB_NAME_SERVER) {
    process.env.DB_NAME_SERVER = result.parsed.DB_NAME_SERVER;
  }
}

setTypeParser(20, parseFloat);
setTypeParser(1114, str => new Date(str + 'Z'));

const knexfile: TKnexfile = {
  development: {
    client: 'pg',
    connection: `pg://${process.env.DB_USER_SERVER}:${process.env.DB_PASSWORD_SERVER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME_SERVER}`,
    pool: {
      min: 0,
      max: 20,
      idleTimeoutMillis: 1000,
      reapIntervalMillis: 1000,
      createTimeoutMillis: 30000,
      // acquireConnectionTimeout: 60000,
      destroyTimeoutMillis: 5000
    }, 
  },
  production: {
    client: 'pg',
    connection: `pg://${process.env.DB_USER_SERVER}:${process.env.DB_PASSWORD_SERVER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME_SERVER}`,
    pool: {
      min: 0,
      max: 20,
      idleTimeoutMillis: 1000,
      reapIntervalMillis: 1000,
      createTimeoutMillis: 30000,
      // acquireConnectionTimeout: 60000,
      destroyTimeoutMillis: 5000
    },  
  },
  local: {
    client: 'postgresql',
    connection: 'postgresql://postgres:abcd1234!@localhost:5432/postgres',
    pool: {
      min: 0,
      max: 20,
      idleTimeoutMillis: 1000,
      reapIntervalMillis: 1000,
      createTimeoutMillis: 30000,
      // acquireConnectionTimeout: 60000,
      destroyTimeoutMillis: 5000
    }
  }
};

export const getKnexConfigWithTenant = (tenant: string) => {
  const env = process.env.APP_ENV || 'development';
  const config = knexfile[env] as Knex.Config;
  config.asyncStackTraces = true;
  
  return {
    ...config,
    wrapIdentifier: (value: string, origImpl: (value: string) => string) => {
      return origImpl(value);
    },
    postProcessResponse: (result: Record<string, unknown>[] | unknown) => {
      // Add any post-processing logic if necessary
      return result;
    },
    acquireConnectionTimeout: 60000,
    afterCreate: (conn: Knex.Client, done: Function) => {
      conn.on('error', (err: Error) => {
        console.error('Database connection error:', err);
      });
      conn.query(`SET app.current_tenant = '${tenant}'`, (err: Error) => {
        done(err, conn);
      });
    },
    afterRelease: (conn: Knex.Client, done: Function) => {
      conn.query('SELECT 1', (err: Error) => {
        if (err) {
          done(err, conn);
        } else {
          done(null, conn);
        }
      });
    }
  } as Knex.Config;
};

export default knexfile;
