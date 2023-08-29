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

io.on('connection', (socket) => {
  console.log('connected');

  const command = "pm2 logs";

  var result=``;
  var std;
  var stderr; // Declare stderr variable



  const dataInterval = setInterval(() => {
    exec(command, (error, stdout, stderr) => {
//     var result ;
//     var std ='' ; 
  
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Handle error
        result = error;
      }
      if (stderr) {
  
        std = `${stderr}`;
      }

            std = `${stdout}`;

    });
    socket.emit('logs', { std: std, stdout: stderr, result: result });

  }, 5000);

  // Clean up interval when the socket disconnects
  socket.on('disconnect', () => {
    clearInterval(dataInterval);
    console.log('disconnected');
  });
});

//   const logInterval = setInterval(() => {
//     // const randomValue = Math.random() * 100;

//     const command = "pm2 log";

//     var result ;
//     var std ='' ; 
  
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         // Handle error
//         result = error;
//       }
//       if (stderr) {
  
//         std = `${stderr}`;
//       }
      
//       // Store stdout and render the view here, inside the callback
//       std = `${stdout}`;
  
      
  
//       // std = JSON.parse(std);
//       socket.emit('logValue', {result: std });
     
//       // res.render("server", { result: std,error:`${error}`, stderr:`${stderr}` , stdout:`${stdout}` });
//     });



    
//   }, 3000);


//   socket.on('disconnect', () => {
//     clearInterval(dataInterval);
//     clearInterval(logInterval);
//   });
// });




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


app.get("/logs", (req, res) => {

  
    res.render('logs');

});


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
  
