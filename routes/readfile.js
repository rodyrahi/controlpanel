
const express = require('express');
const { ssh,  server ,app , bodyParser } = require('../server.js');
var router = express.Router();




router.post('/', async (req, res) => {
    const filePath = req.body.filePath;
    console.log(filePath);

    try {
    const isfile = await ssh.execCommand(`cd ${filePath}`);
    let std = result.stdout

    res.send(
      `<pre>Status ✨:\n${result.stdout}\n\nErrors 💀:\n${result.stderr}</pre>`
    );


    } catch (error) {

    
    try {
      const result = await ssh.execCommand(`cat ${filePath}`);
      std = result.stdout


      res.json({ content:std });
  

    } catch (error) {
      console.error('Error reading file:', error);
      res.render('error', { error: 'Error reading the file' });
    }
    }

  });
  


  
router.post('/save-file', async (req, res) => {
    try {
      const filePath = req.body.filePath;
      const content = req.body.content;
  



      await ssh.execCommand(`echo '${content}' > ${filePath}`);
  
      res.json({ message: 'File saved successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error saving the file' });
    } 
  });


router.post('/file', async (req, res) => {
    const path = req.body.filePath;
    res.render('partials/fileditor' ,  {path})
});

module.exports = router