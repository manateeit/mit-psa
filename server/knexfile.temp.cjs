/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Calculate secrets directory path once at module load
const DOCKER_SECRETS_PATH = '/run/secrets';
const LOCAL_SECRETS_PATH = '../secrets';
const SECRETS_PATH = fs.existsSync(DOCKER_SECRETS_PATH) ? DOCKER_SECRETS_PATH : LOCAL_SECRETS_PATH;

function getSecret(secretName, envVar, defaultValue = '') {
  const secretPath = path.join(SECRETS_PATH, secretName);
  try {
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    if (process.env[envVar]) {
      console.warn(`Using ${envVar} environment variable instead of Docker secret`);
      const envVal = process.env[envVar] || defaultValue;
      console.log(`Using ${envVar} environment variable: ${envVal}`);
      return envVal;
    }
    console.warn(`Neither secret file ${secretPath} nor ${envVar} environment variable found, using default value`);
    return defaultValue;
  }
}

// Base configuration for migrations (uses postgres user)
const migrationConfig = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER_ADMIN || 'postgres',
    password: getSecret('postgres_password', 'DB_PASSWORD_ADMIN'),
    database: process.env.DB_NAME_SERVER,
  },
  pool: {
    min: 2,
    max: 20,
    afterCreate: (conn, done) => {
      conn.query('SET session_replication_role = replica;', (err) => {
        done(err, conn);
      });
    }
  },
  migrations: {
    directory: "./migrations"
  },
  seeds: {
    directory: "./seeds/dev",
    loadExtensions: ['.cjs', '.js']
  }
};

module.exports = {
  migration: migrationConfig
};
