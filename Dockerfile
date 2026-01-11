FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Copy all source files
COPY . .

# Default command: run tests
CMD ["npm", "test"]
