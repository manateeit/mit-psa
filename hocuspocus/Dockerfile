FROM node:22.5.1 AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --only=production


FROM node:22.5.1-slim

WORKDIR /app

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy built node modules and source files
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set ownership to the non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 1234

CMD ["node", "server.js"]
