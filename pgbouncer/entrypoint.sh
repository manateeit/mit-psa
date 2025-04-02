#!/bin/sh
set -e

# Read secrets
POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
DB_PASSWORD_SERVER=$(cat /run/secrets/db_password_server)

# Escape potential special characters in passwords for sed
POSTGRES_PASSWORD_ESC=$(echo "$POSTGRES_PASSWORD" | sed -e 's/[\/&]/\\&/g')
DB_PASSWORD_SERVER_ESC=$(echo "$DB_PASSWORD_SERVER" | sed -e 's/[\/&]/\\&/g')

# Substitute placeholders in userlist.txt with actual passwords from secrets
# Using '#' as delimiter for sed to avoid issues with '/' in passwords
sed -i "s#POSTGRES_PASSWORD_PLACEHOLDER#$POSTGRES_PASSWORD_ESC#g" /etc/pgbouncer/userlist.txt
sed -i "s#DB_PASSWORD_SERVER_PLACEHOLDER#$DB_PASSWORD_SERVER_ESC#g" /etc/pgbouncer/userlist.txt

# Ensure proper ownership if running as root (permissions set during build)
if [ "$(id -u)" = "0" ]; then
  chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
fi

# Start pgbouncer
exec pgbouncer /etc/pgbouncer/pgbouncer.ini