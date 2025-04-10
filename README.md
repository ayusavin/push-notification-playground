# Push Notification Microservice

A simple microservice for push notifications built with Deno and TypeScript.

## Features

- Simple web UI for displaying your token and received notifications
- API endpoint for sending push notifications
- Persistent storage using Deno KV
- Real-time update of notifications via polling
- Rate limiting to prevent API abuse

## Running the Service

```bash
# Run in development mode with auto-reload
deno task dev
```

This will start the server on http://localhost:8000.

## API Endpoints

### Send a Push Notification

```
POST /api/v1/notify
```

Headers:
- `Authorization`: Bearer {token} - The token to send the notification to
- `Content-Type`: application/json

Body:
```json
{
  "message": "Your notification message here"
}
```

Response Headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit window resets

Example using curl:
```bash
curl -X POST http://localhost:8000/api/v1/notify \
  -H "Authorization: Bearer 12345678-1234-1234-1234-123456789012" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello world!"}'
```

### Get Notifications for a User

```
GET /api/v1/notifications?token={token}
```

Example using curl:
```bash
curl http://localhost:8000/api/v1/notifications?token=12345678-1234-1234-1234-123456789012
```

## Rate Limiting

The service implements rate limiting to prevent abuse:

- 10 requests per minute per token
- When limit is exceeded, returns HTTP 429 (Too Many Requests)
- Response includes headers and body with details about the limit and when it resets

Rate limit exceeded response example:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 45 seconds.",
  "limit": 10,
  "remaining": 0,
  "resetAt": "2023-05-20T15:30:45.123Z"
}
```

## Web UI

Access the web UI by opening http://localhost:8000 in your browser. The UI will:

1. Assign a unique token to your browser (stored in a cookie)
2. Display this token in the center of the screen
3. Provide a button to copy the token
4. Show a list of all notifications sent to this token

You can use this token to send notifications via the API.

## License

MIT 