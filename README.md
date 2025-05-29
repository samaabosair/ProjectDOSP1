
---

##  Services Overview

###  Catalog Service (`catalog`)
- **Port**: `5000`
- **Endpoints**:
  - `GET /search/:topic` – Search books by topic.
  - `GET /info/:id` – Get detailed info about a book.
- **Data**: Stored in `catalog.json`.

---

###  Order Service (`order`)
- **Port**: `5001`
- **Endpoints**:
  - `POST /purchase/:id` – Attempt to buy a book.
- **Behavior**:
  - Checks book availability from Catalog.
  - If available, calls `decrement` to reduce stock.
  - Logs the purchase in `orders.json`.
- **Failure Handling**:
  - Returns `400` with `{ "error": "Out of stock" }` if quantity is zero.
  - Returns `500` if the catalog service fails.

---

### Frontend Service (`frontend`)
- **Port**: `5002`
- Optional service to connect to users.
- Currently basic/placeholder.

---

##  Docker Setup

All services are containerized and run together via Docker Compose.

###  To Build and Run:

```bash
docker-compose up --build
```

###  To Test the performance-tests:
 
## info 
```bash
node test-info.js
```
## search
```bash
node test-search.js
```
## purchase
```bash
node test-purchase.js
```