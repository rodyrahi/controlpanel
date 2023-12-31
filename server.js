const http = require('http');
const session = require('express-session');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { NodeSSH } = require('node-ssh');
const server = http.createServer(app);
const { userdb, scriptsdb } = require('./routes/db.js');
const path = require('path');

const fs = require('fs');
const { auth, requiresAuth } = require('express-openid-connect');
const simpleGit = require('simple-git');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

var isWin = process.platform === 'win32';
var baseurl = !isWin ? 'https://kadmin.online' : 'http://localhost:9111';
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: '3qnLXoHY1TDBvbGhD1Hj24eXk54Rjs2SXZFuXrEj9XvefDMA-uhc4U7dO-VZek4A',
  baseURL: baseurl,
  clientID: 'zj17AAKjTh0ZrdOmD3O7hiXTKc1UwHAy',
  issuerBaseURL: 'https://dev-t42orpastoaad3st.us.auth0.com',
};
app.use(
  session({
    secret: 'fasfasgdghreyt4wsgsdfsdfwer',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(auth(config));

const ssh = new NodeSSH();
module.exports = { ssh, server, app, bodyParser };


const scriptsRouter = require('./routes/scripts/scripts.js');
const terminalRouter = require('./routes/terminal.js');
const readfileRouter = require('./routes/readfile.js');
const apiRouter = require('./routes/api.js');
const cronjobRouter = require('./routes/cronjobs.js');
const blogRouter = require('./routes/blog/blog.js');
const subRouter = require('./routes/subscription/subscription.js');


app.use('/', scriptsRouter);
app.use('/terminal', terminalRouter);
app.use('/readfile', readfileRouter);
app.use('/api', apiRouter);
app.use('/cronjob', cronjobRouter);
app.use('/blog', blogRouter);
app.use('/subscription', subRouter);


const putConfig = {
  flags: 'w', // w - write and a - append
  encoding: null, // use null for binary files
  mode: 0o666, // mode to use for created file (rwx)
  autoClose: true // automatically close the write stream when finished
};





app.post("/upload", async(req, res) => {
  try {


    ssh.putFile('./kadmin.png', '/root/app/kadmin.png').then(function() {
      console.log("The File thing is done")
    }, function(error) {
      console.log("Something's wrong")
      console.log(error)
    })


  }catch(error){
    console.log(error);
  }


});



app.get("/server", requiresAuth(), (req, res) => {
  const user = req.oidc.user.sub;
  const email = req.oidc.user.email;

  // Check if the user exists in the database
  const result = userdb.prepare("SELECT * FROM user WHERE user = ?").get(user);

  if (result) {
    // User exists; check if their expiration date is within the limit
    const expirationDate = new Date(result.expire);
    const currentDate = new Date();
    //   currentDate.setDate(currentDate.getDate() + 7); // Adjust this limit as needed

    console.log(expirationDate, currentDate);

    if (expirationDate > currentDate) {
      // The user's expiration date is within the limit, render the 'login' page
      res.render("login" , {ssh:req.session.sshConfig});
    } else {
      res.send("buy it now 😄");
    }
  } else {
    // User doesn't exist, so create a new user with a 7-day trial
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const expire = today.toISOString().split("T")[0];

    userdb
      .prepare("INSERT INTO user (user, email, expire) VALUES (?, ?, ?)")
      .run(user, email, expire);

    // Render the 'login' page since a new user was created
    res.render("login");
  }
});



app.get("/", (req, res) => {

  res.render("home");
});




  

app.get("/apps", async (req, res) => {
  try {
    const [lsResult, pm2Result] = await Promise.all([
      ssh.execCommand("ls"),
      ssh.execCommand("pm2 jlist"),
    ]);

    // Process lsResult and pm2Result in parallel
    const [folder, appList] = await Promise.all([
      processLsResult(lsResult),
      processPm2Result(pm2Result),
    ]);

    const scripts = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);

    res.render("partials/createapp", { folder, apps: appList , sysuser , scripts});
  } catch (error) {
    res.send("Failed to connect to the SSH server or encountered an error.");
  }
});



app.get("/folders", async (req, res) => {
  let folder = [];
  try {
    const { stdout, stderr } = await ssh.execCommand("ls -la", {
      cwd: `/${sysuser}/app`,
    });
    folder = stdout.split("\n").filter(Boolean);

    res.render("partials/folders", { folder });
  } catch (error) {
    res.status(500).send(`Error listing directory: ${error.message}`);
    return;
  }
});

app.get("/website", (req, res) => {
  res.render("partials/createwebsite");
});


var sysuser =''
app.post("/connect", async (req, res) => {
  const { host, username, password } = req.body;

  req.session.host = host;
  req.session.username = username;
  req.session.password = password;



    sysuser = username


    if (!req.session.sshConfig) {

      req.session.sshConfig  = {
        host,
        username,
        password,
  
      }
  
    }

  try {
    
    await ssh.connect(req.session.sshConfig) ;




    res.redirect("/dashboard");
   
  } catch (error) {
    res.send("Failed to connect to the SSH server." );
  }



});



const checkSessionVariables = (req, res, next) => {
  if (
    req.path === "/connect" ||
    req.path === "/" ||
    req.path === "/server" ||
    req.path === "/profile" ||
    req.path === "/userinfo" ||
    (req.session.sshConfig)
  ) {
    next();
  } else {


      res.redirect("/login")


      
    

  }
};

app.use(checkSessionVariables);




app.get("/dashboard", async (req, res) => {

  
  const result = scriptsdb.prepare("SELECT * FROM scripts WHERE user=?").all(req.oidc.user.sub);

  const isuser = userdb.prepare("SELECT * FROM user WHERE user=?").all(req.oidc.user.sub);

  console.log(isuser);
  isuser[0].phone ?   res.render("index.ejs", { scripts: result , sysuser }): res.redirect("/userinfo") 
 
});

app.get("/status", async (req, res) => {
  const result = scriptsdb.prepare("SELECT * FROM scripts WHERE user=?").all(req.oidc.user.sub);

  console.log(result);
  res.render("partials/status", { scripts: result });
});

async function processLsResult(lsResult) {
  const folder = lsResult.stdout.split("\n").filter(Boolean);
  return folder;
}

async function processPm2Result(pm2Result) {
  const appList = JSON.parse(pm2Result.stdout);

  return appList;
}


app.post("/execute", async (req, res) => {
  const { command } = req.body;

  try {
    const { stdout, stderr } = await ssh.execCommand(command);

    // Check if the command contains 'error' or 'fatal', and highlight them in red
    const formattedStdout = highlightErrors(stdout);
    const formattedStderr = highlightErrors(stderr);

    res.send(
      `<pre>Status ✨:\n${formattedStdout}\n\nErrors 💀:\n${formattedStderr}</pre>`
    );
  } catch (error) {
    res.send(`Error executing the command: ${error.message}`);
  }

  try {
    const { stdout, stderr } = await ssh.execCommand(`cd /root/app/controlpanel && git pull`);

      console.log(`Status ✨:\n${stdout}\n\nErrors 💀:\n${stderr}`);

  } catch (error) {
    console.log(error);
  }

});

function highlightErrors(text) {
  return text.replace(
    /error|fatal/gi,
    (match) => `<span style="color: red">${match}</span>`
  );
}

app.post("/changedir", async (req, res) => {
  var { dir } = req.body;

  console.log(dir);
  try {
    const { stdout, stderr } = await ssh.execCommand(dir);
    folder = stdout.split("\n").filter(Boolean);




      res.render("partials/folders", { folder });

    

  } catch (error) {
    res.send(`Error executing the command: ${error.message}`);
  }
});








app.get("/createwebsite.sh", (req, res) => {
  const filePath = path.join(__dirname, "createwebsite.sh");

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send("Error reading the file.");
    } else {
      res.setHeader("Content-disposition", "attachment; createwebsite.sh");
      res.setHeader("Content-type", "application/x-sh");
      res.send(data);
    }
  });
});



app.get("/sqlite", (req, res) => {
  res.render("partials/sqlite");
});


app.get("/userinfo", (req, res) => {

  res.render("partials/detailsform");
});
app.post("/userinfo", (req, res) => {

  const {name , phone } = req.body

 
  userdb.prepare("UPDATE user SET name = ?, phone = ? WHERE user = ?")
  .run(name, phone, req.oidc.user.sub);

  res.redirect('/dashboard')
});


app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

server.listen(9111, () => {
  console.log("Server is running on http://localhost:9111");
});
