FROM edoburu/pgbouncer:latest

COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY entrypoint.sh /entrypoint.sh

# Create userlist.txt with placeholders and set permissions during build
RUN touch /etc/pgbouncer/userlist.txt && \
    echo '"postgres" "POSTGRES_PASSWORD_PLACEHOLDER"' > /etc/pgbouncer/userlist.txt && \
    echo '"app_user" "DB_PASSWORD_SERVER_PLACEHOLDER"' >> /etc/pgbouncer/userlist.txt && \
    chmod 600 /etc/pgbouncer/userlist.txt # Ownership will be set in entrypoint if needed

ENTRYPOINT ["/entrypoint.sh"]