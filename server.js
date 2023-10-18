const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { NodeSSH } = require('node-ssh');
// const SSH = require('simple-ssh');
const {userdb , scriptsdb} = require('./db');
const path = require('path');
const ssh = new NodeSSH();
const fs = require('fs');



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.render('login');
});


app.get('/home', (req, res) => {
    res.render('home');
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

        res.render('partials/folders', {folder});

    } catch (error) {
        res.status(500).send(`Error listing directory: ${error.message}`);
        return;
    }

});

app.get('/website', (req, res) => {
    res.render('partials/createwebsite');
});


// app.get('/command/:cmd', async (req, res) => {

//     const cmd  = req.params.cmd

//     console.log(cmd);
//     try {
   
//         const { stdout, stderr } = await ssh.execCommand(cmd);
        
//         res.redirect('/dashboard');

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


        res.redirect('/dashboard');
        // res.json(apps)

    } catch (error) {
        res.send('Failed to connect to the SSH server.');
    }
});

app.get('/dashboard', async (req, res) => {
    

    const result = scriptsdb.prepare('SELECT * FROM scripts').all()


    res.render('index.ejs' , {scripts:result});
});

app.get('/status', async (req, res) => {

  
    const result = scriptsdb.prepare('SELECT * FROM scripts').all()


    res.render('partials/status', {scripts:result} );

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


// app.get('/folders/:dir', async (req, res) => {
//     let folder = [];

//     const dir = req.params.dir ? req.params.dir : '/';
//     try {
  
        


//         // List the contents of the specified directory within the current directory
//         const { stdout, stderr } = await ssh.execCommand('ls', { cwd:`${dir}` });
//         folder = stdout.split('\n').filter(Boolean);

//         res.render('folders', { folder });
   

//         // Use '\n' to split lines and filter out empty lines
//     } catch (error) {
//         res.status(500).send(`Error listing directory: ${error.message}`);
//         return;
//     }

    
// });





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

app.post('/changedir', async (req, res) => {
    const { dir  } = req.body;
   
    console.log(dir);
        try {
            const { stdout, stderr } = await ssh.execCommand(dir);
            folder = stdout.split('\n').filter(Boolean);

            
            res.render('partials/folders', {folder});
    
        } catch (error) {
            
            res.send(`Error executing the command: ${error.message}`);
        }
    
});








app.get('/createwebsite.sh', (req, res) => {
    const filePath = path.join(__dirname, 'createwebsite.sh');
  
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.status(500).send('Error reading the file.');
      } else {
        res.setHeader('Content-disposition', 'attachment; createwebsite.sh');
        res.setHeader('Content-type', 'application/x-sh');
        res.send(data);
      }
    });
  });


app.get('/scripts', (req, res) => {
    const result = scriptsdb.prepare('SELECT * FROM scripts').all()
   
    res.render('partials/scripts' , {result:result})
});
app.post('/createscript', (req, res) => {
    const { scriptname,script , id} = req.body

    const result = scriptsdb.prepare('SELECT * FROM scripts WHERE id= ?').get(id);
  
    if (!result) {
        scriptsdb.prepare(`INSERT INTO scripts (name , script) VALUES (?,?) `).run(scriptname,script) 

    }else{
        scriptsdb.prepare('UPDATE scripts SET name = ?, script = ? WHERE id = ?').run(scriptname, script, id);

    }

    

    console.log('done');
    res.redirect('/scripts')
});





app.get('/deletescript/:id', (req, res) => {
    const id = req.params.id;

    // Assuming you have a database connection and a table named 'scripts'
    scriptsdb.prepare('DELETE FROM scripts WHERE id = ?').run(id)

           
    res.redirect('/scripts'); // Redirect to the scripts page after successful deletion
   
});

app.get('/sqlite', (req, res) => {

   
    res.render('partials/sqlite' )
});

app.listen(9111, () => {
    console.log('Server is running on http://localhost:9111');
});
