# E-commerce Microservices Backend

## Overview

This project is a backend system for an e-commerce platform built using a microservices architecture. The goal is to create a scalable and maintainable system by decoupling different functionalities into independent services.

## Architecture

The backend currently consists of the following microservices:

*   **User Service:** Handles all aspects of user management, including registration, login, and authentication token generation.
*   **Product Service:** Manages product information, providing CRUD (Create, Read, Update, Delete) operations for products.
*   **API Gateway:** Acts as a single entry point for all client requests. It routes incoming requests to the appropriate backend service.

**Data Storage:**
*   MongoDB is used as the primary database. Each service that requires data persistence has its own dedicated MongoDB instance to ensure data isolation (e.g., `mongo_user` for User Service, `mongo_product` for Product Service).

**Inter-Service Communication:**
*   RabbitMQ is used for asynchronous inter-service communication. This allows services to communicate without being directly coupled, improving resilience and scalability. For example, when a new user registers, the User Service publishes a `user.registered` event, which other services (like the Product Service) can subscribe to.

## Services

The following services are part of this application, orchestrated by Docker Compose:

| Service           | Responsibility                                      | Host Port(s)                     | Container Port(s) | Notes                                      |
|-------------------|-----------------------------------------------------|----------------------------------|-------------------|--------------------------------------------|
| `api-gateway`     | Routes client requests to appropriate services      | `3000`                           | `3000`            | Single entry point for the backend         |
| `user-service`    | User registration, login, authentication          | `3001`                           | `3001`            |                                            |
| `product-service` | Product catalog management (CRUD)                   | `3002`                           | `3002`            |                                            |
| `mongo_user`      | MongoDB for User Service                            | `27018`                          | `27017`           | Data for User Service                      |
| `mongo_product`   | MongoDB for Product Service                         | `27019`                          | `27017`           | Data for Product Service                   |
| `rabbitmq`        | Message broker for inter-service communication      | `5672` (AMQP), `15672` (Mgmt UI) | `5672`, `15672`   | Management UI: http://localhost:15672 (guest/guest) |

## Prerequisites

To run this project, you will need:

*   Docker Engine
*   Docker Compose

## Getting Started / How to Run

Follow these instructions to get the application running locally using Docker Compose:

1.  **Clone the repository** (if you haven't already):
    ```bash
    # git clone <repository-url>
    # cd ecommerce-microservices 
    # Note: This command assumes you are in the root of the cloned project.
    # If the script is run from within the 'ecommerce-microservices' directory, 
    # this 'cd' is not needed.
    ```

2.  **Build and start all services:**
    Navigate to the `ecommerce-microservices` directory (if not already there) where the `docker-compose.yml` file is located, and run:
    ```bash
    docker-compose up --build -d
    ```
    This command builds the images for each service (if they don't exist or if changes are detected) and starts all services in detached mode (`-d`).

3.  **Stopping the services:**
    To stop all running services, use:
    ```bash
    docker-compose down
    ```

4.  **Viewing logs:**
    *   To view logs for all services:
        ```bash
        docker-compose logs -f
        ```
    *   To view logs for a specific service (e.g., `user-service`):
        ```bash
        docker-compose logs -f user-service
        ```

## Environment Variables

*   **Local Development (Non-Docker):** Each service (`user-service`, `product-service`, `api-gateway`) contains a `.env.example` file. For local development *without* Docker, you would typically copy this to a `.env` file within that service's directory and customize it as needed (e.g., for different database URIs if not using the Dockerized MongoDB instances).
*   **Docker Compose:** When running the application with `docker-compose up`, environment variables are primarily managed within the `docker-compose.yml` file. This is especially crucial for service-to-service communication (e.g., `USER_SERVICE_URL` for the API Gateway, `USER_DB_URI` for the User Service connecting to its MongoDB container) and for setting credentials or specific configurations for the containerized environment. The `.env` files within individual service directories are *not* directly used by the Docker containers unless explicitly copied or mounted, which is not the default setup in the provided Dockerfiles.

## API Endpoints (High-Level via API Gateway)

The API Gateway provides a unified interface to the backend services. Here are some example endpoints:

*   **User Registration:** `POST /api/users/register`
    *   Payload: `{ "name": "John Doe", "email": "john.doe@example.com", "password": "securepassword123" }`
*   **User Login:** `POST /api/users/login`
    *   Payload: `{ "email": "john.doe@example.com", "password": "securepassword123" }`
*   **Create Product:** `POST /api/products`
    *   Payload: `{ "name": "Laptop Pro", "description": "High-performance laptop", "price": 1200, "stock": 50, "sku": "LP001" }`
*   **Get All Products:** `GET /api/products`

The API Gateway routes these requests to the appropriate microservice (e.g., `/api/users/*` to User Service, `/api/products/*` to Product Service).

## Inter-Service Communication Example

*   **User Registration Event (`user.registered`):**
    1.  When a new user successfully registers via the User Service.
    2.  The User Service publishes an event message to the `user_events` exchange in RabbitMQ with the routing key `user.registered`.
    3.  The Product Service (as a demonstration) subscribes to this exchange and routing key, listening for these events via its dedicated queue (`product_service_user_registered_queue`).
    4.  Currently, upon receiving the event, the Product Service logs the message. This can be extended to perform actions like creating a customer profile or initializing user-specific product recommendations.

## Directory Structure

The project is organized into directories, each representing a microservice or a shared component:

```
ecommerce-microservices/
├── api-gateway/        # API Gateway service
│   ├── src/
│   ├── Dockerfile
│   └── ...
├── product-service/    # Product management service
│   ├── src/
│   ├── Dockerfile
│   └── ...
├── user-service/       # User management service
│   ├── src/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml  # Docker Compose file for orchestrating all services
└── README.md           # This file
```

This structure helps in maintaining separation of concerns and allows for independent development and deployment of services.

## Fastify Prototype

To explore alternatives to Express, a prototype service built with **Fastify** is
included in the `fastify-product-service` directory. This lightweight service
implements a couple of sample endpoints and provides scripts to benchmark its
performance against a minimal Express implementation.

### Running the prototype

```bash
cd fastify-product-service
npm install
npm run dev
```

The service exposes `/api/v1/products` and `/health` on the port defined in
`.env` (defaults to `3003`).

### Benchmarking Fastify vs Express

Inside the same directory a `benchmark` script is available:

```bash
npm run benchmark
```

This starts an in-memory Express server and the Fastify server, then uses
`autocannon` to compare throughput and latency. Example output:

```
┌─────────┬──────────┬─────────┐
│ (index) │ requests │ latency │
├─────────┼──────────┼─────────┤
│ Express │ 5611     │ 8.4     │
│ Fastify │ 22548.8  │ 1.62    │
└─────────┴──────────┴─────────┘
```

Fastify handles significantly more requests per second with lower latency,
illustrating its efficiency and ergonomic API for building services.

### Steps towards the new architecture

1. Add a new service folder (e.g. `fastify-product-service`).
2. Implement a Fastify server in `src/index.ts` and configure TypeScript.
3. Provide npm scripts for development, building and benchmarking.
4. Use the benchmark results to evaluate adopting Fastify for other services.
