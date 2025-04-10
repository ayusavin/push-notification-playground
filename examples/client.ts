// A simple client example for sending push notifications
// Run this with: deno run --allow-net examples/client.ts <token> "Your message"

if (Deno.args.length < 2) {
  console.error("Usage: deno run --allow-net examples/client.ts <token> \"Your message\"");
  Deno.exit(1);
}

const token = Deno.args[0];
const message = Deno.args[1];

console.log(`Sending notification to token ${token}...`);
console.log(`Message: ${message}`);

try {
  const response = await fetch("http://localhost:8000/api/v1/notify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  // Get rate limit info from headers
  const rateLimit = {
    limit: response.headers.get("X-RateLimit-Limit") || "unknown",
    remaining: response.headers.get("X-RateLimit-Remaining") || "unknown",
    reset: response.headers.get("X-RateLimit-Reset") || "unknown",
  };
  
  console.log("Rate limit info:");
  console.log(`  Limit: ${rateLimit.limit}`);
  console.log(`  Remaining: ${rateLimit.remaining}`);
  console.log(`  Reset: ${new Date(parseInt(rateLimit.reset, 10) * 1000).toLocaleString()}`);
  
  // Handle rate limit error
  if (response.status === 429) {
    const error = await response.json();
    console.error("Rate limit exceeded!");
    console.error(error.message);
    Deno.exit(1);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send notification: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  console.log("Notification sent successfully!");
  console.log("Response:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Error sending notification:", error.message);
  Deno.exit(1);
} 