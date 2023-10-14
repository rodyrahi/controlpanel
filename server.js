const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 9111;
const { exec } = require("child_process");
const http = require('http');
const socketIO = require('socket.io');
const cron = require('node-cron');
const webPush = require('web-push');
const pm2 = require('pm2');

// Configure Express
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create an HTTP server and WebSocket
const server = http.createServer(app);
const io = socketIO(server);

// Initialize Web Push with your VAPID keys
  
const vapidKeys = {
  publicKey: 'BP__PbJMkGDI6ZgZ1MsR3btGgql-bbBf5wTyZWWOWaQns8ibH8g6410VdYfx9T4_bNOlZVLJz5AA2_JYjh0YzTo',
  privateKey: 'i81qgoWJqCsiWsYODRqYllgDRlqO-SjWfYU8xh2VIqE',
};

webPush.setVapidDetails(
  'mailto:rodyrahi126@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscribers for Web Push notifications
const subscribers = [];

// Route to subscribe to notifications
app.use(express.json());
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscribers.push(subscription);
  res.status(201).json({ message: 'Subscribed successfully' });
});

// Schedule PM2 process checking every 5 seconds
cron.schedule('*/5 * * * * *', checkPM2Processes);

// Function to check PM2 processes
function checkPM2Processes() {
  pm2.list((err, processList) => {
    if (err) {
      console.error('PM2 list error:', err);
      return;
    }

    const stoppedApps = processList.filter((app) => app.pm2_env.status === 'stopped');

    if (stoppedApps.length > 0) {
      const appNames = stoppedApps.map((app) => app.name).join(', ');
      const message = `The following PM2 app(s) are stopped: ${appNames}`;
      sendNotifications(message);
    }
  });
}

// Function to send Web Push notifications
function sendNotifications(message) {
  subscribers.forEach((subscription) => {
    webPush.sendNotification(subscription, JSON.stringify({ title: 'App Stopped', message }))
      .catch((error) => {
        console.error('Web Push notification error:', error);
      });
  });
}

// Route to serve the main page
app.get("/", (req, res) => {
  // Replace this with your logic to get PM2 process information
  pm2.list((err, processList) => {
    if (err) {
      console.error('PM2 list error:', err);
      return;
    }
    res.render("server", { result:processList });
  });
});

// Route to execute commands
app.post("/cmd", (req, res) => {
  const { command } = req.body;

  const pm2Process = exec(command);

  let logContent = '';
  pm2Process.stdout.on('data', (data) => {
    logContent += data.toString();
  });

  pm2Process.on('exit', () => {
    const logLines = logContent.split('\n');
    const last15Lines = logLines.slice(-20);

    // Format the last 15 lines for display, highlighting errors in red
    let formattedLog = '<pre>';
    last15Lines.forEach((line) => {
      if (line.includes('error') || /error|fatal/i.test(line)) {
        formattedLog += `<span style="color: red">${line}</span>\n`;
      } else {
        formattedLog += line + '\n';
      }
    });
    formattedLog += '</pre>';

    // Replace <br> with newline characters (\n)
    formattedLog = formattedLog.replace(/<br>/g, '\n');

    res.send(formattedLog);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});


