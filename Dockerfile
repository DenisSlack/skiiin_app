FROM node:20-alpine

WORKDIR /app

# Install dependencies including netcat
RUN apk add --no-cache netcat-openbsd

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy TypeScript config and source files
COPY tsconfig*.json ./
COPY server ./server
COPY client ./client
COPY init.sh ./

# Make init script executable
RUN chmod +x init.sh

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8081

# Command to run the initialization script
CMD ["/bin/sh", "./init.sh"] 