# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first to leverage cache
COPY package.json package-lock.json* bun.lockb* ./

# Install dependencies (handling possible different lock files)
RUN if [ -f bun.lockb ]; then \
    npm install -g bun && bun install; \
    else \
    npm install; \
    fi

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
