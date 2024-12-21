# Stage 1: Build the application
FROM node:slim AS builder

WORKDIR /app

# Install build dependencies only in builder stage
RUN apt-get update && \
    apt-get install -y build-essential python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

# Stage 2: Production image
FROM node:slim

WORKDIR /app

# Explicitly create required runtime directories
RUN mkdir -p /app/Public/temp

# Copy only necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port and run the application
EXPOSE 8000

CMD ["node", "src/index.js"]
