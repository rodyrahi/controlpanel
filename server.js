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

}




app.get("/logs/:apps", (req, res) => {


  
  const apps = req.params.apps
  
  const dataInterval = setInterval(() => {
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
        clearInterval(dataInterval);
        process.kill(); // Kill the process when the client disconnects
  
      });
    });
    // socket.emit('logs', { std: std, stdout: stderr, result: result });
  }, 5000);
    res.render('logs');

});

app.get('/db', async (req, res) => {
  try {
    const dbFiles = await listDBFiles(directoryPath); // Replace directoryPath with your database directory
    const db = new Database(dbFiles[0]) 
    console.log(db);



    res.render('database', { db: dbFiles });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/query', async(req, res) => {
  try {
    const dbFiles = await listDBFiles(directoryPath); // Replace directoryPath with your database directory

    const {query , dbquery} = req.body;

    dbFiles.forEach(element => {

      if (element === dbquery) {
        

      const db = new Database(element) 
      const result = db.prepare(query).all()
      res.send(result)

    }

    });



  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
