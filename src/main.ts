import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.207.0/http/cookie.ts";
import { Status } from "https://deno.land/std@0.207.0/http/http_status.ts";
import { renderHtml } from "./ui/html.ts";

// Type definition for notification
interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

// Generate a random UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Initialize Deno KV
const kv = await Deno.openKv();

// Store notification in KV
async function storeNotification(token: string, message: string) {
  const id = generateUUID();
  const timestamp = new Date().toISOString();
  await kv.set(["notifications", token, id], { id, message, timestamp });
  return { id, message, timestamp };
}

// Get all notifications for a user
async function getNotifications(token: string): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const iter = kv.list<Notification>({ prefix: ["notifications", token] });
  for await (const entry of iter) {
    notifications.push(entry.value);
  }
  return notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Handle push notification endpoint
  if (url.pathname === "/api/v1/notify" && req.method === "POST") {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response("Missing Authorization header", { status: Status.Unauthorized });
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { message } = await req.json();
      
      if (!message) {
        return new Response("Missing message in request body", { status: Status.BadRequest });
      }
      
      const notification = await storeNotification(token, message);
      return new Response(JSON.stringify(notification), {
        headers: { "Content-Type": "application/json" },
        status: Status.Created,
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: Status.InternalServerError });
    }
  }
  
  // Handle notifications fetch endpoint
  if (url.pathname === "/api/v1/notifications") {
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token parameter", { status: Status.BadRequest });
    }
    
    const notifications = await getNotifications(token);
    return new Response(JSON.stringify(notifications), {
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // Serve the UI for any other path
  if (req.method === "GET") {
    const cookies = getCookies(req.headers);
    let token = cookies["user_token"];
    
    // If no token cookie, set one
    if (!token) {
      token = generateUUID();
    }
    
    const headers = new Headers({ "Content-Type": "text/html" });
    setCookie(headers, {
      name: "user_token",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    return new Response(renderHtml(token), {
      headers,
    });
  }
  
  return new Response("Not Found", { status: Status.NotFound });
}

console.log("Push notification server running on http://localhost:8000");
await serve(handler, { port: 8000 });
