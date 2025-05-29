
# Design Document: Book Purchase System

## 1. Introduction

The design and architecture of a book purchasing system with three primary services—**Catalog**, **Order**, and **Frontend**—are described in this document. Users can read book information, search for books, and make purchases using the system. Docker is used to build the services, and HTTP API calls are used for inter-service communication.

## 2. System Overview

The system is made up of three services:
1. **Catalog Service**: Manages the book catalog, provides book details, and decrements the stock when a purchase is made.
2. **Order Service**: Handles the purchasing process, including checking stock availability, processing purchases, and storing order records.
3. **Frontend Service**: Acts as the user interface, allowing users to search for books, view information, and make purchases.

These services are containerized using Docker and communicate with each other through REST APIs. Each service is built and deployed as a separate Docker container.

## 3. System Components

### 3.1 Catalog Service
- **Purpose**: Manages the catalog of books, including book information (title, description, quantity, etc.).
- **Endpoints**:
    - `GET /info/:id`: Returns information about a book by its ID.
    - `GET /search/:topic`: Returns a list of books based on the topic search.
    - `POST /purchase/:id`: Decrements the stock of a book after a successful purchase.
- **Data Storage**: Book data is stored in a JSON file (`catalog.json`).
- **Docker**: The service is containerized using Docker and listens on port `5000`.

### 3.2 Order Service
- **Purpose**: Manages the order process, including checking book availability and storing purchase records.
- **Endpoints**:
    - `POST /purchase/:id`: Handles the purchase of a book. It checks the book's stock, decrements the stock, and stores the order details in a file (`orders.json`).
- **Data Storage**: Purchase records are stored in a JSON file (`orders.json`).
- **Docker**: The service is containerized using Docker and listens on port `5001`.

### 3.3 Frontend Service
- **Purpose**: Acts as the user interface for interacting with the system. It enables users to search for books, view information, and make purchases.
- **Endpoints**:
    - `GET /search/:topic`: Fetches books related to the given topic from the catalog service.
    - `GET /info/:id`: Retrieves detailed information about a specific book from the catalog service.
    - `POST /purchase/:id`: Initiates a purchase request by calling the order service.
- **Docker**: The service is containerized using Docker and listens on port `5002`.

## 4. System Flow

### 4.1 Searching for Books
- The user can search for books by topic via the `GET /search/:topic` endpoint in the Frontend Service. This triggers a request to the `GET /search/:topic` endpoint in the Catalog Service, which returns a list of matching books.

### 4.2 Viewing Book Information
- The user can view detailed information about a specific book via the `GET /info/:id` endpoint in the Frontend Service. This triggers a request to the `GET /info/:id` endpoint in the Catalog Service, which returns the details of the book (e.g., title, author, quantity).

### 4.3 Making a Purchase
- When the user initiates a purchase via the `POST /purchase/:id` endpoint in the Frontend Service, the following occurs:
    1. The Frontend Service sends a request to the `POST /purchase/:id` endpoint in the Order Service.
    2. The Order Service checks if the book is in stock by calling the `GET /info/:id` endpoint in the Catalog Service.
    3. If the book is in stock, the Order Service decrements the stock by calling the `POST /decrement/:id` endpoint in the Catalog Service.
    4. The Order Service then records the purchase in the `orders.json` file and returns a success message, including the order details (ID, title, and time of purchase).

## 5. Docker Configuration

```yaml
version: '3'
services:
  catalog:
    build: ./catalog
    ports:
      - "5000:5000"
    volumes:
      - ./catalog/catalog.json:/app/catalog.json
    networks:
      - book-network

  catalog-replica:
    build: ./catalog
    ports:
      - "5004:5000"
    volumes:
      - ./catalog/catalog.json:/app/catalog.json
    networks:
      - book-network

  order:
    build: ./order
    depends_on:
      - catalog
    ports:
      - "5001:5001"
    volumes:
      - ./order/orders.json:/app/orders.json
    networks:
      - book-network

  order-replica:
    build: ./order
    depends_on:
      - catalog
    ports:
      - "5003:5001"
    volumes:
      - ./order/orders.json:/app/orders.json
    networks:
      - book-network

  frontend:
    build: ./frontend
    depends_on:
      - order
      - order-replica
      - catalog
      - catalog-replica
    ports:
      - "5002:5002"
    networks:
      - book-network

networks:
  book-network:
    driver: bridge
```

### 5.1 Dockerfile for Catalog Service

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000
CMD ["node", "catalog.js"]
```

### 5.2 Dockerfile for Order Service

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5001
CMD ["node", "order.js"]
```

### 5.3 Dockerfile for Frontend Service

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5002
CMD ["node", "frontend.js"]
```

## 6. Part 2 Additions

- Logging mechanism in the frontend to display detailed latency and cache status.
- Load balancing in the frontend between order and order-replica servers.
- Replication support added for catalog and order services.
- Docker Compose support for deploying replicas.
- Performance metrics printed in the frontend (cache hits, latency, etc.).
