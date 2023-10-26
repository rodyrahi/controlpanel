
const express = require('express');
const { ssh,  server ,app , bodyParser } = require('../server.js');
var router = express.Router();




router.post('/', async (req, res) => {
  const filePath = req.body.filePath;
    console.log(req.body);
    try {

        const result = await ssh.execCommand(`cat ${filePath}`);
        console.log('File content:');
        // Display the file content

        const std = result.stdout
  
        res.json({ std });
      } catch (error) {
        console.error('Error reading file:', error);
      }

});
router.post('/save-file', async (req, res) => {
    try {
      const filePath = req.body.filePath;
      const content = req.body.content;
  
      // Connect to the SSH server

  
      // Use SSH to write the content to the file
      await ssh.execCommand(`echo '${content}' > ${filePath}`);
  
      res.json({ message: 'File saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error saving the file' });
    } 
  });


router.get('/', async (req, res) => {

    res.render('partials/fileditor')
});

module.exports = router