# user-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy application source code
COPY . .

# Build TypeScript
RUN npm install --only=development # Install devDependencies for build
RUN npm run build # Assuming you have a "build": "tsc" script in package.json

# --- Release Stage ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy production dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy compiled application code from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port (should match USER_SERVICE_PORT in .env)
EXPOSE 3001 

# Command to run the application
CMD ["node", "dist/index.js"]
