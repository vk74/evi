# Version: 1.2
# Description: Multi-stage Dockerfile for the ev2 backend.
# Creates a build stage to compile TypeScript and a lean runtime stage.
# Backend file: Dockerfile

# =========================
# Build stage
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY tsconfig.json ./
COPY ./src ./src

# Copy keys explicitly (they are ignored by .gitignore but needed for runtime)
COPY ./src/core/keys ./src/core/keys

# Build the application (npm run build will correctly use the tsc from node_modules)
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled code from the build stage
COPY --from=build /app/dist ./dist

# Copy the private keys from the build stage into the correct location
COPY --from=build /app/src/core/keys ./dist/keys

# Create a symlink for module-alias to work correctly.
# The application uses '@/' which points to 'src/', so we link 'src' to 'dist'
# where the compiled code and keys now reside.
RUN ln -s /app/dist /app/src


# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/server.js"]


