
const express = require('express');
const { Server } = require('socket.io');
const { ssh,  server } = require('../server.js');
const io = new Server(server);
var router = express.Router();




router.get('/', (req, res) => {
  // res.render('partials/terminal.')
});

io.on('connection', (socket) => {
 

      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      return ssh.requestShell()
    .then((shell) => {
      shell.on('data', (data) => {
        socket.emit('data', data.toString('binary'));
      });

      socket.on('data', (data) => {
        shell.write(data);
      });

      shell.on('close', () => {
        ssh.dispose();
        socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
      });
    })
    .catch((err) => {
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
    });
});


module.exports = router