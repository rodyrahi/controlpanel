const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 9111;
const { exec } = require("child_process");
const http = require('http');
const socketIO = require('socket.io');
const { stderr } = require("process");


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));



app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketIO(server);


console.log('test');




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



 
    console.log(std);

    if (std) {
      res.redirect("/");

    }

   
  });
});


app.post("/cmd", (req, res) => {
  console.log(req.body);
  const {command } = req.body

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



 
    console.log(std);

    if (std) {
      res.redirect("/");

    }

   
  });
});


app.get("/logs/:apps", (req, res) => {


  
  const apps = req.params.apps
  const maxProcesses = 1;
  const processQueue = [];
  
  io.on('connection', (socket) => {
    console.log('Client connected');
  
    if (processQueue.length < maxProcesses) {
      const command = `pm2 logs ${apps?apps:''}`;
  
      const process = exec(command);
      processQueue.push(process);
  
      process.stdout.on('data', (data) => {
        const logLine = data.toString().trim();
        socket.emit('log', logLine);
      });
  
      process.on('close', () => {
        const index = processQueue.indexOf(process);
        if (index !== -1) {
          processQueue.splice(index, 1); // Remove the process from the queue
        }
      });
    }
  
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      processQueue.forEach((process) => {
        process.kill(); // Kill all processes when the client disconnects
      });
      processQueue.length = 0; // Clear the process queue
    });
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

});


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
