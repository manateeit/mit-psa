/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
require('dotenv').config()

const { seed } = require("./seeds/dev/01_tenants");

const DatabaseType = {
  postgres: 'postgres'
};

const externals = {
  [DatabaseType.postgres]: 'pg'
  // Add more alternatives as needed
};

const isValidDbType = (type) => {
  return type !== undefined && Object.keys(externals).includes(type);
};

const getClient = () => {
  const dbType = process.env.DB_TYPE;

  if (isValidDbType(dbType)) {
    return externals[dbType];
  }

  console.warn(`Invalid or missing DB_TYPE: ${dbType}. Defaulting to postgres.`);
  return externals[DatabaseType.postgres];
};

const createConnectionWithTenant = (config, tenant) => {
  return {
    ...config,
    pool: {
      ...config.pool,
      afterCreate: (conn, done) => {
        conn.query(`SET SESSION "app.current_tenant" = '${tenant}';`, (err) => {
          if (err) {
            console.error('Error setting tenant:', err);
          }
          done(err, conn);
        });
      },
    },
  };
};

const knexfile = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER_ADMIN,
      password: process.env.DB_PASSWORD_ADMIN,
      database: process.env.DB_NAME_SERVER,
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: "./migrations"
    },
    seeds: {
      directory: "./seeds/dev"
    },
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER_ADMIN,
      password: process.env.DB_PASSWORD_ADMIN,
      database: process.env.DB_NAME_SERVER,
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: "./migrations"
    },
  },
  local: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: '5432',
      user: 'postgres',
      password: 'abcd1234!',
      database: 'postgres',
    },
    migrations: {
      directory: "./migrations"
    },
  },
};

module.exports = {
  ...knexfile,
  createConnectionWithTenant,
};
