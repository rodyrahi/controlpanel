
const express = require('express');
const { ssh,  server ,app , bodyParser } = require('../server.js');
var router = express.Router();






router.post('/', async (req, res) => {
    const {cron} = req.body
    try {
        const { stdout, stderr } = await ssh.execCommand('crontab -l');
        const list = stdout

        console.log(list);
        if (list.includes(cron)) {
            console.log('is there');
            res.send('exists')
        }else{
            await ssh.execCommand(`(crontab -l;  echo "*/1 * * * * ${cron}") | crontab -`);
            res.send('ok')

        }

    }catch(error){
        console.log(error);
    }

   

});

router.post('/all', async (req, res) => {
    const {cron} = req.body
    try {
        const { stdout, stderr } = await ssh.execCommand('crontab -l');
        const list = stdout

        console.log(list);
        if (list.includes(cron)) {
            console.log('is there');
            res.send('exists')
        }else{
            await ssh.execCommand(`(crontab -l;  echo "*/1 * * * * ${cron}") | crontab -`);
            res.send('ok')

        }

    }catch(error){
        console.log(error);
    }

   

});

module.exports = router