-- Insert sample data only if APP_ENV is 'development'
\c {DB_NAME_HOCUSPOCUS}
-- FIXME: This is only for testing purposes
DO $$
BEGIN
        INSERT INTO users (username, email, password_hash, first_name, last_name, date_of_birth)
        VALUES
            ('johndoe', 'john@example.com', 'hashed_password_1', 'John', 'Doe', '1990-01-15');
END $$;
