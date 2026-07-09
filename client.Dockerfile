# Stage 1: Build the React application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build


# Stage 2: Serve using Nginx
FROM nginx:alpine

# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]