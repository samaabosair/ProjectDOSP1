# Use official Node.js LTS image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose the port used by catalog-service
EXPOSE 5000

# Start the catalog service
CMD ["node", "catalog.js"]
