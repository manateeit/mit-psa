const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const CE_MIGRATIONS_PATH = path.join(__dirname, '../../server/migrations');
const EE_MIGRATIONS_PATH = path.join(__dirname, './migrations');
const TEMP_MIGRATIONS_PATH = path.join(__dirname, './temp_migrations');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_MIGRATIONS_PATH)) {
  fs.mkdirSync(TEMP_MIGRATIONS_PATH);
}

try {
  // Copy CE migrations to temp directory
  console.log('Copying CE migrations...');
  fs.readdirSync(CE_MIGRATIONS_PATH).forEach(file => {
    const sourcePath = path.join(CE_MIGRATIONS_PATH, file);
    const destPath = path.join(TEMP_MIGRATIONS_PATH, file);
    fs.copyFileSync(sourcePath, destPath);
  });

  // Copy EE migrations to temp directory
  console.log('Copying EE migrations...');
  fs.readdirSync(EE_MIGRATIONS_PATH).forEach(file => {
    const sourcePath = path.join(EE_MIGRATIONS_PATH, file);
    const destPath = path.join(TEMP_MIGRATIONS_PATH, file);
    fs.copyFileSync(sourcePath, destPath);
  });

  // Run migrations
  console.log('Running all migrations...');
  process.env.KNEX_MIGRATIONS_DIR = TEMP_MIGRATIONS_PATH;
  execSync('npx knex migrate:latest', { 
    stdio: 'inherit',
    env: { ...process.env, KNEX_MIGRATIONS_DIR: TEMP_MIGRATIONS_PATH }
  });

  console.log('Migrations completed successfully');
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
} finally {
  // Clean up: remove temp directory
  if (fs.existsSync(TEMP_MIGRATIONS_PATH)) {
    fs.rmSync(TEMP_MIGRATIONS_PATH, { recursive: true });
    console.log('Cleaned up temporary files');
  }
}
