# Integration Example Documentation

## Overview

This project demonstrates a full real-world mesh-sync setup with multiple source types, transformer chains, and automation scripts.

The integration example covers JSON config extraction, OpenAPI type generation, environment variable filtering, markdown section extraction, and vendor code bundling.

## API Guide

The API is available at `https://api.example.com/v2`.

### Authentication

All requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### GET /health

Returns the current health status of the service.

**Response:**
```json
{
  "status": "ok",
  "uptime": 86400,
  "version": "2.0.0"
}
```

#### GET /items

Returns a paginated list of items.

**Query Parameters:**
- `limit` (integer, default: 20) - Maximum number of items to return
- `offset` (integer, default: 0) - Number of items to skip

**Response:**
```json
{
  "items": [{ "id": "...", "name": "...", "price": 9.99 }],
  "total": 42
}
```

### Error Handling

All errors follow the standard format:

```json
{
  "error": { "code": "NOT_FOUND", "message": "Resource not found" }
}
```

## Deployment

### Prerequisites

- Node.js 18+
- Docker (optional, for containerized deployment)
- Access to the production database

### Steps

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `env-template.env`)
4. Run migrations: `npm run migrate`
5. Start the server: `npm start`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PUBLIC_API_URL` | Base URL for the API | Yes |
| `SECRET_DB_PASSWORD` | Database password | Yes |
| `SECRET_API_KEY` | External API key | Yes |
