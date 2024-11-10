# Use an official Node.js runtime as a parent image
FROM node:22.5.1

RUN apt-get update && apt-get install -y \
    graphicsmagick \
    imagemagick \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy root package.json first (will be copied from the build context)
COPY package.json package-lock.json ./

# Copy server package.json
COPY server/package.json server/package-lock.json ./server/

# Install dependencies from root package.json
RUN npm install

# Copy the server directory contents
COPY server/ ./server/

RUN rm -f ./server/.env

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

WORKDIR /app/server
