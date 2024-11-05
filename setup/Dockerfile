FROM node:latest

WORKDIR /app

# Install database clients using apt
RUN apt-get update && apt-get install -y \
    postgresql-client \
    default-mysql-client \
    sqlite3

ENV abc=1234

# Copy necessary files
COPY setup/bash/log.sh /app/log.sh
COPY setup/bash/entrypoint.sh /app/entrypoint.sh
COPY server/package.json /app/package.json
COPY ee/server/setup/create_database.js /app/server/setup/create_database.js
COPY server/knexfile.js /app/knexfile.js

COPY server/migrations /app/migrations
COPY server/seeds/dev /app/seeds/dev

RUN mkdir -p /app/migrations /app/seeds/dev

# Make scripts executable
RUN chmod +x /app/entrypoint.sh /app/log.sh

# Install dependencies
RUN npm install
RUN npm install -g knex

WORKDIR /app
