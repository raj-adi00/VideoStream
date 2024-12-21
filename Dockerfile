# Stage 1: Build the application
FROM node:slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Stage 2: Production image
FROM node:slim

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y build-essential python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and built node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

EXPOSE 8000

CMD ["node", "src/index.js"]