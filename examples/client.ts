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