-- Create the database
DO $$ BEGIN PERFORM log_message('Creating database {DB_NAME_HOCUSPOCUS}'); END $$;
CREATE DATABASE {DB_NAME_HOCUSPOCUS} TEMPLATE {DB_NAME};

-- Create the user
DO $$ BEGIN PERFORM log_message('Creating USER {DB_USER_HOCUSPOCUS}'); END $$;
CREATE USER {DB_USER_HOCUSPOCUS} WITH PASSWORD '{DB_PASSWORD_HOCUSPOCUS}';

\c {DB_NAME_HOCUSPOCUS}

DO $$ BEGIN PERFORM log_message('Closing all connections to {DB_NAME} to avoid any error '); END $$;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '{DB_NAME}'
  AND pid <> pg_backend_pid();


-- Grant usage on schema
DO $$ BEGIN PERFORM log_message('Granting schemas permissions to user {DB_USER_HOCUSPOCUS}'); END $$;
GRANT USAGE ON SCHEMA public TO {DB_USER_HOCUSPOCUS};

-- Grant all privileges on all tables in the schema
DO $$ BEGIN PERFORM log_message('Granting all privileges for all tables to user {DB_USER_HOCUSPOCUS}'); END $$;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {DB_USER_HOCUSPOCUS};

-- Grant all privileges on all sequences in the schema
DO $$ BEGIN PERFORM log_message('Granting all privileges for all sequences to user {DB_USER_HOCUSPOCUS}'); END $$;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {DB_USER_HOCUSPOCUS};

-- Grant all privileges on all functions in the schema

DO $$ BEGIN PERFORM log_message('Granting all privileges for all functions to user {DB_USER_HOCUSPOCUS}'); END $$;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO {DB_USER_HOCUSPOCUS};

-- Grant all privileges on the database
DO $$ BEGIN PERFORM log_message('Granting all privileges for database to user {DB_USER_HOCUSPOCUS}'); END $$;
GRANT ALL PRIVILEGES ON DATABASE {DB_NAME_HOCUSPOCUS} TO {DB_USER_HOCUSPOCUS};




-- Create the users table
-- FIXME: This is only for testing purposes
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);