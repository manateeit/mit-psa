FROM alpine:latest

# Install common database clients
RUN apk add --no-cache postgresql-client mysql-client sqlite

# Copy your files
COPY ./ ./

# Install any additional tools or dependencies
RUN apk add --no-cache bash

# Use a more general entrypoint script
COPY ./bash/entrypoint.sh /entrypoint.sh
COPY ./bash/log.sh /log.sh
RUN chmod +x /entrypoint.sh