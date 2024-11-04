-- Create an enum for log levels
CREATE TYPE log_level AS ENUM ('INFO', 'WARNING', 'ERROR', 'DEBUG');

-- Create a function for logging with colors to terminal only, including database name
CREATE OR REPLACE FUNCTION log_message(log_text TEXT, level log_level DEFAULT 'INFO') RETURNS VOID AS $$
DECLARE
    color_code TEXT;
    reset_code TEXT := E'\033[0m';  -- Reset color
    db_name TEXT;
    formatted_message TEXT;
BEGIN
    -- Get current database name
    SELECT current_database() INTO db_name;

    -- Choose color based on log level
    CASE level
        WHEN 'INFO' THEN color_code := E'\033[32m'; -- Green
        WHEN 'DEBUG' THEN color_code := E'\033[33m'; -- Yellow
        WHEN 'WARNING' THEN color_code := E'\033[35m'; -- Purple
        WHEN 'ERROR' THEN color_code := E'\033[31m'; -- Red
    END CASE;

    -- Construct the formatted message
    formatted_message := color_code || '[' || level::TEXT || '][' || db_name || '] '  || log_text || reset_code;

    -- Raise notice with the formatted message
    RAISE NOTICE '%', formatted_message;
END;
$$ LANGUAGE plpgsql;


DO $$ BEGIN PERFORM log_message('Setting app.environment as [ {APP_ENV} ]'); END $$;
ALTER DATABASE {DB_NAME} SET app.environment = '{APP_ENV}';

