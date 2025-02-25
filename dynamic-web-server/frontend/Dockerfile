# 1) Build Stage
FROM node:20 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies first (leveraging Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files
COPY . .

# Build the Next.js application (for production)
RUN npm run build

# 2) Production Stage
FROM node:20 AS runner

# Set working directory
WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose frontend port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]