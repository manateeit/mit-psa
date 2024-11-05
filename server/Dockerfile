# Use an official Node.js runtime as a parent image
FROM node:22.5.1

RUN apt-get update && apt-get install -y \
    graphicsmagick \
    imagemagick \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

    # Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app
COPY ../package.json /app

RUN rm -f /app/.env

# Install any needed packages specified in package.json
RUN npm install
RUN npm install next

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production