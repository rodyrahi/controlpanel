const express = require('express');
const { Server } = require('socket.io');
const {  server } = require('../server.js');
const io = new Server(server);
var router = express.Router();
const { NodeSSH } = require("node-ssh");






router.get('/', (req, res) => {

  if (!req.session.host || !req.session.username || !req.session.password) {
    return res.status(400).send('Missing session information');
  }


  // Connect to SSH
  const sshConfig = {
    host: req.session.host,
    username: req.session.username,
    password: req.session.password,
  };

  const terminalssh = new NodeSSH()
  terminalssh.connect(sshConfig)
    .then(() => {
      console.log(req.session.host, req.session.username, req.session.password);
      res.render('partials/terminal');

      // Set up Socket.IO connection
      io.on('connection', (socket) => {
        socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');

        return terminalssh.requestShell()
          .then((shell) => {
            shell.on('data', (data) => {
              socket.emit('data', data.toString('binary'));
            });

            socket.on('data', (data) => {
              shell.write(data);
            });

            socket.on('disconnect', (data) => {
              terminalssh.dispose()
            });

            shell.on('close', () => {
              terminalssh.dispose();

            });
          })
          .catch((err) => {
            socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
          });
      });
    })
    .catch((err) => {
      console.error('SSH connection error:', err);
      res.status(500).send('Error connecting to SSH');
    });

});


module.exports = router;
