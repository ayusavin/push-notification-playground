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

// Type definition for rate limit
interface RateLimit {
  count: number;
  resetAt: number;
}

// Rate limit configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Maximum requests allowed
  WINDOW_MS: 60 * 1000, // Time window in milliseconds (1 minute)
};

// Generate a random UUID
function generateUUID(): string {
  return crypto.randomUUID();
}

// Initialize Deno KV
const kv = await Deno.openKv();

// Check and update rate limit for a token
async function checkRateLimit(token: string): Promise<{ allowed: boolean; limit: RateLimit }> {
  const now = Date.now();
  const rateLimitKey = ["ratelimit", token];
  
  // Get current rate limit info
  const rateLimitEntry = await kv.get<RateLimit>(rateLimitKey);
  let rateLimit = rateLimitEntry.value;
  
  // If no rate limit exists or it's expired, create a new one
  if (!rateLimit || rateLimit.resetAt < now) {
    rateLimit = {
      count: 0,
      resetAt: now + RATE_LIMIT.WINDOW_MS,
    };
  }
  
  // Check if limit is reached
  const allowed = rateLimit.count < RATE_LIMIT.MAX_REQUESTS;
  
  // Increment count if allowed
  if (allowed) {
    rateLimit.count++;
    await kv.set(rateLimitKey, rateLimit, { expireIn: RATE_LIMIT.WINDOW_MS });
  }
  
  return { allowed, limit: rateLimit };
}

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
      
      // Check rate limit
      const { allowed, limit } = await checkRateLimit(token);
      if (!allowed) {
        const resetInSeconds = Math.ceil((limit.resetAt - Date.now()) / 1000);
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: `Too many requests. Try again in ${resetInSeconds} seconds.`,
            limit: RATE_LIMIT.MAX_REQUESTS,
            remaining: 0,
            resetAt: new Date(limit.resetAt).toISOString(),
          }),
          {
            status: Status.TooManyRequests,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": RATE_LIMIT.MAX_REQUESTS.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(limit.resetAt / 1000).toString(),
              "Retry-After": resetInSeconds.toString(),
            }
          }
        );
      }
      
      const { message } = await req.json();
      
      if (!message) {
        return new Response("Missing message in request body", { status: Status.BadRequest });
      }
      
      const notification = await storeNotification(token, message);
      return new Response(JSON.stringify(notification), {
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RATE_LIMIT.MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": (RATE_LIMIT.MAX_REQUESTS - limit.count).toString(),
          "X-RateLimit-Reset": Math.ceil(limit.resetAt / 1000).toString(),
        },
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