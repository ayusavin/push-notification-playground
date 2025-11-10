export function renderHtml(token: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Push Notification Service</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 30px;
      text-align: center;
    }
    .token-display {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .id-display {
      font-size: 18px;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-right: 10px;
      flex-grow: 1;
      background-color: #f9f9f9;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-button {
      background-color: #4285f4;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .copy-button:hover {
      background-color: #3367d6;
    }
    .example-section {
      margin-top: 20px;
      margin-bottom: 30px;
    }
    .curl-example-button {
      background-color: #34a853;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
      display: block;
    }
    .curl-example-button:hover {
      background-color: #2d9348;
    }
    .notifications-list {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
      text-align: left;
    }
    .notification {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .notification-time {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }
    .no-notifications {
      color: #888;
      padding: 20px 0;
      text-align: center;
    }
    h1 {
      margin-bottom: 30px;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 20px;
    }
    .loading {
      text-align: center;
      padding: 20px;
      color: #888;
    }
    .error {
      color: #d32f2f;
      padding: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Push Notification Service</h1>
    
    <div>
      <h2>Your Token</h2>
      <div class="token-display">
        <div class="id-display" id="token">${token}</div>
        <button class="copy-button" id="copyButton">Copy Token</button>
      </div>
      <p>Use this token in the Authorization header when sending notifications</p>
      
      <div class="example-section">
        <button class="curl-example-button" id="curlExampleButton">Copy curl Example</button>
        <p>Copy a ready-to-use curl command with your token</p>
      </div>
    </div>
    
    <div class="notifications-list">
      <h2>Your Notifications</h2>
      <div id="notifications">
        <div class="loading">Loading notifications...</div>
      </div>
    </div>
  </div>

  <script>
    // Copy token to clipboard
    document.getElementById('copyButton').addEventListener('click', function() {
      const token = document.getElementById('token').textContent;
      navigator.clipboard.writeText(token)
        .then(() => {
          this.textContent = 'Copied!';
          setTimeout(() => {
            this.textContent = 'Copy Token';
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          this.textContent = 'Failed to copy';
          setTimeout(() => {
            this.textContent = 'Copy Token';
          }, 2000);
        });
    });
    
    // Copy curl example to clipboard
    document.getElementById('curlExampleButton').addEventListener('click', function() {
      const token = document.getElementById('token').textContent;
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      const baseUrl = port ? \`\${protocol}//\${hostname}:\${port}\` : \`\${protocol}//\${hostname}\`;
      const curlCommand = \`curl -X POST \${baseUrl}/api/v1/notify \\
  -H "Authorization: Bearer \${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello world!"}'\`;
      
      navigator.clipboard.writeText(curlCommand)
        .then(() => {
          this.textContent = 'Copied!';
          setTimeout(() => {
            this.textContent = 'Copy curl Example';
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          this.textContent = 'Failed to copy';
          setTimeout(() => {
            this.textContent = 'Copy curl Example';
          }, 2000);
        });
    });

    // Function to format date as DD.MM.YYYY HH:MM:SS:mmmm
    function formatDate(dateString) {
      const date = new Date(dateString);
      
      // Pad to ensure 2 digits
      const padZero = (num, length = 2) => String(num).padStart(length, '0');
      
      const day = padZero(date.getDate());
      // Month is 0-indexed in JavaScript
      const month = padZero(date.getMonth() + 1);
      const year = date.getFullYear();
      
      const hours = padZero(date.getHours());
      const minutes = padZero(date.getMinutes());
      const seconds = padZero(date.getSeconds());
      const milliseconds = padZero(date.getMilliseconds(), 4);
      
      return \`\${day}.\${month}.\${year} \${hours}:\${minutes}:\${seconds}:\${milliseconds}\`;
    }

    // Function to render notifications
    function renderNotifications(notifications) {
      const container = document.getElementById('notifications');
      
      if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications">No notifications received yet</div>';
        return;
      }
      
      let html = '';
      notifications.forEach(notification => {
        html += \`
          <div class="notification">
            <div>\${notification.message}</div>
            <div class="notification-time">\${formatDate(notification.timestamp)}</div>
          </div>
        \`;
      });
      
      container.innerHTML = html;
    }

    // Function to fetch notifications
    async function fetchNotifications() {
      const token = document.getElementById('token').textContent;
      try {
        const response = await fetch(\`/api/v1/notifications?token=\${token}\`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const notifications = await response.json();
        renderNotifications(notifications);
      } catch (error) {
        document.getElementById('notifications').innerHTML = 
          \`<div class="error">Error loading notifications: \${error.message}</div>\`;
      }
    }

    // Initial fetch and poll every 5 seconds
    fetchNotifications();
    setInterval(fetchNotifications, 5000);
  </script>
</body>
</html>
  `;
}
