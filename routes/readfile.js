
const express = require('express');
const { ssh,  server ,app , bodyParser } = require('../server.js');
var router = express.Router();




router.post('/', async (req, res) => {
    const filePath = req.body.filePath;
    console.log(filePath);
    
    try {
      const result = await ssh.execCommand(`cat ${filePath}`);
      console.log('File content:');
      console.log(result.stdout);
      
      let r = result.stdout;
      let std = JSON.parse(JSON.stringify(r)).replace(/\n/g, "\\n")
      

      res.render('partials/fileditor', { std });
  

    } catch (error) {
      console.error('Error reading file:', error);
      // Handle errors as needed
      res.render('error', { error: 'Error reading the file' });
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


// router.get('/', async (req, res) => {

//     res.render('partials/fileditor')
// });

module.exports = router