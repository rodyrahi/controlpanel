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



// Wrap your code in a function
function runCode(apps) {
  io.on('connection', (socket) => {
    console.log('Client connected');

    const command = `pm2 logs ${apps ? apps : ''} --nostream`;

    const process = exec(command);
    process.stdout.on('data', (data) => {
      var logLine = data.toString().trim();
      socket.emit('log', logLine);
    });

    process.on('close', () => {
      console.log('Process closed');
      process.kill();
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      process.kill(); // Kill the process when the client disconnects
    });
  });
}


app.get("/logs/:apps", (req, res) => {


  
  const apps = req.params.apps
  
  setInterval(runCode(apps), 5000);
    res.render('logs');

});


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
