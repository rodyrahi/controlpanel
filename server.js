const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { NodeSSH } = require('node-ssh');
const SSH = require('simple-ssh');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const ssh = new NodeSSH();

app.get('/', (req, res) => {
    res.render('login');
});

app.get('/apps', async(req, res) => {
    try {
        const [lsResult, pm2Result] = await Promise.all([
            ssh.execCommand('ls'),
            ssh.execCommand('pm2 jlist')
        ]);

        // Process lsResult and pm2Result in parallel
        const [folder, appList] = await Promise.all([
            processLsResult(lsResult),
            processPm2Result(pm2Result)
        ]);

        res.render('partials/createapp' ,  { folder, apps: appList });

    } catch (error) {
        res.send('Failed to connect to the SSH server or encountered an error.');
    }

});



app.get('/gitrepos', async(req, res) => {
    let folder = [];
    try {

        const { stdout, stderr } = await ssh.execCommand('ls', { cwd:`/root/app` });
        folder = stdout.split('\n').filter(Boolean);

        res.render('partials/gitrepos', {folder});

    } catch (error) {
        res.status(500).send(`Error listing directory: ${error.message}`);
        return;
    }

});




// app.get('/command/:cmd', async (req, res) => {

//     const cmd  = req.params.cmd

//     console.log(cmd);
//     try {
   
//         const { stdout, stderr } = await ssh.execCommand(cmd);
        
//         res.redirect('/home');

//     } catch (error) {
//         res.status(500).send(`Error retrieving PM2 apps: ${error.message}`);
//     } 
// });


app.post('/connect', async (req, res) => {
    const { host, username, password } = req.body;

    try {
        await ssh.connect({
            host,
            username,
            password,
        });


        res.redirect('/home');
        // res.json(apps)

    } catch (error) {
        res.send('Failed to connect to the SSH server.');
    }
});

app.get('/home', async (req, res) => {
    try {
        const [lsResult, pm2Result] = await Promise.all([
            ssh.execCommand('ls'),
            ssh.execCommand('pm2 jlist')
        ]);

        // Process lsResult and pm2Result in parallel
        const [folder, appList] = await Promise.all([
            processLsResult(lsResult),
            processPm2Result(pm2Result)
        ]);

        res.render('index', { folder, apps: appList });
    } catch (error) {
        res.send('Failed to connect to the SSH server or encountered an error.');
    }
});

async function processLsResult(lsResult) {
    const folder = lsResult.stdout.split('\n').filter(Boolean);
    return folder;
}

async function processPm2Result(pm2Result) {
    const appList = JSON.parse(pm2Result.stdout);

    return appList;
}




app.get('/pm2-apps', async (req, res) => {
    try {
        // Execute the 'pm2 jlist' command to get a JSON representation of PM2 apps
        const { stdout, stderr } = await ssh.execCommand('pm2 jlist');
        
        // Parse the JSON output
        const appList = JSON.parse(stdout);
        
        // Extract the app names and statuses
        const apps = appList.map(app => ({ name: app.name, status: app.pm2_env.status , pwd:app.pm2_env.versioning.repo_path }));
        
        res.render('apps', { apps });
    } catch (error) {
        res.status(500).send(`Error retrieving PM2 apps: ${error.message}`);
    }
});


app.get('/folders/:dir', async (req, res) => {
    let folder = [];

    const dir = req.params.dir ? req.params.dir : '/';
    try {
  
        


        // List the contents of the specified directory within the current directory
        const { stdout, stderr } = await ssh.execCommand('ls', { cwd:`${dir}` });
        folder = stdout.split('\n').filter(Boolean);

        res.render('folders', { folder });
   

        // Use '\n' to split lines and filter out empty lines
    } catch (error) {
        res.status(500).send(`Error listing directory: ${error.message}`);
        return;
    }

    
});





app.post('/execute', async (req, res) => {
    const { command } = req.body;

        try {
            const { stdout, stderr } = await ssh.execCommand( command);

            // Check if the command contains 'error' or 'fatal', and highlight them in red
            const formattedStdout = highlightErrors(stdout);
            const formattedStderr = highlightErrors(stderr);

            res.send(`<pre>Status ✨:\n${formattedStdout}\n\nErrors 💀:\n${formattedStderr}</pre>`);
        } catch (error) {
            res.send(`Error executing the command: ${error.message}`);
        }
    
});

function highlightErrors(text) {

    return text.replace(/error|fatal/gi, (match) => `<span style="color: red">${match}</span>`);
}



app.listen(9111, () => {
    console.log('Server is running on http://localhost:9111');
});
