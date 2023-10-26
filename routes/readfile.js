
const express = require('express');
const { ssh,  server } = require('../server.js');
var router = express.Router();





router.post('/read-file', async (req, res) => {
    try {
        await ssh.connect(sshConfig);
        const result = await ssh.execCommand(`cat ${filePath}`);
        console.log('File content:');
        console.log(result.stdout); // Display the file content

        stdout = result.stdout
        res.json({ stdout });
      } catch (error) {
        console.error('Error reading file:', error);
      } finally {
        ssh.dispose(); // Close the SSH connection
      }
//   try {
//     const filePath = req.body.filePath;

    


//     const content = await fs.readFile(filePath, 'utf-8');
//     res.json({ content });
//   } catch (error) {
//     res.status(500).json({ error: 'Error reading the file' });
//   }

});

router.post('/save-file', async (req, res) => {
  try {
    const filePath = req.body.filePath;
    const content = req.body.content;
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ message: 'File saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error saving the file' });
  }
});


router.get('/', async (req, res) => {

    res.render('partials/fileditor')
});

module.exports = router