First, run:

node setup/create_database.js
npx knex --knexfile knexfile.js migrate:latest --env development
npx knex seed:run --knexfile knexfile.js --env development
