#!/bin/bash

source /app/log.sh
getLogger "database-setup"

# Function to replace placeholders in the SQL file and save to a new file
replace_placeholders() {
    local dest_file=$1
    local script_dir=$2
    send_log info "** Starting to set all configurations **"
    send_log debug "Destination file -> [ $dest_file ]"
    send_log debug "Script directory -> [ $script_dir ]"
    # Get all environment variables
    env | while IFS='=' read -r key value; do
        # Replace placeholders in the destination SQL file
        send_log system "Setting configuration for $key"
        send_log system "Value for $key is $value"
        send_log trace "sed -i 's/{$key}/$value/g' $script_dir/$dest_file"
        echo ""

        #sed -i.bak "s/{$key}/$value/g" "$script_dir/$dest_file" && rm -f "$script_dir/$dest_file".bak
        sed -i "s/{$key}/$value/g" "$script_dir/$dest_file"
    done
    send_log info "** All configurations was set **"
}


check_database_connection() {
    send_log info "** Starting to check database connection and query execution **"
    local count=0
    local max_attempts=100

    while [ $count -lt $max_attempts ]; do
        if PGPASSWORD=$DB_PASSWORD_SUPERUSER pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" > /dev/null 2>&1; then
            send_log info "Database connection established"
            PGPASSWORD=$DB_PASSWORD_SUPERUSER psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT 1"
            # Attempt to execute a simple query
            if PGPASSWORD=$DB_PASSWORD_SUPERUSER psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "SELECT 1" > /dev/null 2>&1; then
                send_log info "Successfully executed a test query"
                return 0
            else
                send_log warn "Connected to database, but failed to execute test query"
            fi
        fi

        send_log trace "Waiting for database connection and query execution... Attempt $((count+1)) of $max_attempts"
        sleep 5
        count=$((count+1))
    done

    send_log error "Failed to establish database connection or execute query after $max_attempts attempts"
    exit 1
}


setup_db(){
    send_log info "** Starting to setup database [ $DB_TYPE ]**"
    case "$DB_TYPE" in
        "postgres")
            # Run create_database.js
            send_log info "Running database creation script..."
            node /app/server/setup/create_database.js

            # Run migrations
            send_log info "Running database migrations..."
            cd /app && npx knex migrate:latest
            npx knex seed:run

            send_log info " ** Database setup completed **"
            ;;
        "mysql")
            # Run create_database.js
            send_log info "Running database creation script..."
            node /app/server/setup/create_database.js

            # Run migrations
            send_log info "Running database migrations..."
            cd /app && npx knex migrate:latest
            npx knex seed:run

            send_log info " ** Database setup completed **"
            ;;
        *)
            send_log error "Unsupported database type: $DB_TYPE"
            exit 1
    esac
}


installed_client(){
    send_log info "** Starting to install client for $DB_TYPE **"
    case "$DB_TYPE" in
        "postgres")
            send_log debug "Installing client for postgres"
            # We already installed postgresql-client in Dockerfile
            send_log debug "Client for postgres installed"
            ;;
        "mysql")
            send_log debug "Installing client for mysql"
            mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD  < /setup.sql
            send_log debug "Client for mysql installed"
            ;;
        *)
            send_log error "Unsupported database type: $DB_TYPE"
            exit 1
            ;;
    esac
}





# Path to init.sql and setup.sql
SETUP_SQL="setup.sql"
#SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_DIR=""



# process_files $SCRIPT_DIR/database/postgres $SCRIPT_DIR/$SETUP_SQL
# send_log info "$>>>>> SETUP.SQL ALREADY CREATED  <<<<<"


# replace_placeholders "$SETUP_SQL" "$SCRIPT_DIR"
# send_log info ">>>>> SETUP.SQL UPDATED USING ENV <<<<<"

installed_client
send_log info ">>>>> CLIENT INSTALLED [ $DB_TYPE  ] <<<<<"


# check_database_connection
# send_log info ">>>>> DATABASE IS READY TO GET CONNECTION  <<<<<"

setup_db

send_log info "-----------------------------"
send_log info "----- PROCESS FINISHED  -----"
send_log info "-----------------------------"

while true; do
    sleep 1
done
