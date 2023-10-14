const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 9111;
const { exec } = require("child_process");
const http = require('http');
const socketIO = require('socket.io');
const { stderr } = require("process");
const Database = require('better-sqlite3');
const {listDBFiles} = require('./public/database.js');
const notifier = require('node-notifier');
const path = require('path');
const cron = require('node-cron');



app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));



app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIO(server);


console.log('test');
const directoryPath = '../database/bundeli';



const checkPM2Processes = () => {
  exec('pm2 ls', (error, stdout, stderr) => {
    if (error) {
      console.error('Error checking PM2 processes:', error);
      return;
    }

    const lines = stdout.split('\n');
    const stoppedApps = [];

    for (const line of lines) {
      if (line.includes('stopped')) {
        const appName = line.split(/\s+/)[2];
        stoppedApps.push(appName);
      }
    }

    if (stoppedApps.length > 0) {
      const message = `The following PM2 app(s) are stopped: ${stoppedApps.join(', ')}`;
      sendNotification(message);
      console.log('app stopped');
    }
  });
};

const sendNotification = (message) => {
  notifier.notify({
    title: 'PM2 Process Monitor',
    message,
  });
};

// Schedule the check every 5 seconds
cron.schedule('*/5 * * * * *', checkPM2Processes);

console.log('PM2 process monitor started. Checking every 5 seconds.');





app.get("/", (req, res) => {
  const command = "pm2 jlist";

  var result ;
  var std ='' ; 

  exec(command, (error, stdout, stderr) => {
    if (error) {
      // Handle error
      result = error;
    }
    if (stderr) {

      std = `${stderr}`;
    }
    
    // Store stdout and render the view here, inside the callback
    std = `${stdout}`;

    

    std = JSON.parse(std);

   
    res.render("server", { result: std,error:`${error}`, stderr:`${stderr}` , stdout:`${stdout}` });
  });
});


app.post("/cmd", (req, res) => {
  console.log(req.body);
  const {command } = req.body



  const pm2 = exec(command);

  let logContent = '';
  pm2.stdout.on('data', (data) => {
      logContent += data.toString();
  });

  pm2.on('exit', () => {
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






// Wrap your code in a function
function runCode(apps) {

}




// app.get("/logs/:apps", (req, res) => {


  
//   const apps = req.params.apps
  
//   const dataInterval = setInterval(() => {
//     io.on('connection', (socket) => {
//       console.log('Client connected');
  
//       const command = `pm2 logs ${apps ? apps : ''} --nostream`;
  
//       const process = exec(command);
//       process.stdout.on('data', (data) => {
//         var logLine = data.toString().trim();
//         socket.emit('log', logLine);
  
//       });
  
//       process.on('close', () => {
//         console.log('Process closed');
//         process.kill();
//       });
  
//       socket.on('disconnect', () => {
//         console.log('Client disconnected');
//         clearInterval(dataInterval);
//         process.kill(); // Kill the process when the client disconnects
  
//       });
//     });
//     // socket.emit('logs', { std: std, stdout: stderr, result: result });
//   }, 5000);
//     res.render('logs');

// });

app.get('/db', async (req, res) => {
  try {
    const dbFiles = await listDBFiles(directoryPath); // Replace directoryPath with your database directory
    // const db = new Database(dbFiles[0]) 
  



    res.render('database', { db: dbFiles });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


function querys( element,query ,dbquery) {
  const dbPath = path.join(directoryPath, dbquery);
  const db = new Database(dbPath);
  return db.prepare(query).all()
}


app.post('/query', async(req, res) => {
  try {
    const dbFiles = await listDBFiles(directoryPath); // Replace directoryPath with your database directory

    const {query , dbquery} = req.body;
    var result
  
    dbFiles.forEach(element => {

      if (element === dbquery) {
          console.log(element , dbquery);
          result = querys(element , query , dbquery)


        }

    });

    res.json(result)


  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// app.js (continued)
app.get('/terminal', (req, res) => {
  const term = exec('bash');
  term.stdout.on('data', (data) => {
      res.write(data.toString());
  });
  term.on('exit', () => {
      res.end();
  });
});

app.get('/log/:apps', (req, res) => {
  // Use PM2 to retrieve and display logs
  const apps = req.params.apps

  const pm2 = exec(`pm2 logs ${apps ? apps : ''} --nostream`);

  let logContent = '';
  pm2.stdout.on('data', (data) => {
      logContent += data.toString();
  });

  pm2.on('exit', () => {
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





app.get("/test", (req, res) => {

    res.render("test");

});



server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
