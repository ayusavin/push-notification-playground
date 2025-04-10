# Push Notification Microservice

A simple microservice for push notifications built with Deno and TypeScript.

## Features

- Simple web UI for displaying your token and received notifications
- API endpoint for sending push notifications
- Persistent storage using Deno KV
- Real-time update of notifications via polling

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

## Web UI

Access the web UI by opening http://localhost:8000 in your browser. The UI will:

1. Assign a unique token to your browser (stored in a cookie)
2. Display this token in the center of the screen
3. Provide a button to copy the token
4. Show a list of all notifications sent to this token

You can use this token to send notifications via the API.

## License

MIT 