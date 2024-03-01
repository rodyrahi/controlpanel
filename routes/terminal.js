const express = require("express");
const { Server } = require("socket.io");
const { ssh,server } = require("../server.js");
const io = new Server(server);
const router = express.Router();
const { NodeSSH } = require("node-ssh");


router.get("/", async (req, res) => {
  try {
    if (!req.session.sshConfig) {
      
      return res.status(400).send("Missing session information");
    }
 
    try {
      await ssh.connect(req.session.sshConfig);
    } catch(error){
      console.log(error);
    }
    
    res.render("partials/terminal");



  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


io.on("connection", (socket) => {
  socket.emit("data", "\r\n* SSH CONNECTION ESTABLISHED *\r\n");


      return ssh.requestShell()

    .then((shell) => {
      shell.on("data", (data) => {
     
        socket.emit("data", data.toString());
      });

      socket.on("data", (data) => {
       
        shell.write(data);
      });

      socket.on("disconnect", () => {
        // Dispose of the SSH client when the user disconnects
        console.log('shell ended');
        shell.close()
      });

      shell.on("close", () => {
        console.log('shell ended / closed');
      });
    })
    .catch((err) => {
      socket.emit(
        "data",
        `\r\n*SSH CONNECTION ERROR: ${err.message}*\r\n`
      );
    });
});

module.exports = router;
