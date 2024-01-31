const http = require("http");
const session = require("express-session");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { NodeSSH } = require("node-ssh");
const server = http.createServer(app);
const { userdb, scriptsdb } = require("./routes/db.js");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { auth, requiresAuth } = require("express-openid-connect");
const simpleGit = require("simple-git");
const multer = require('multer');
const FormData = require('form-data');

const axios = require('axios');
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var isWin = process.platform === "win32";
var baseurl = !isWin ? "https://kadmin.online" : "http://localhost:9111";
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: "3qnLXoHY1TDBvbGhD1Hj24eXk54Rjs2SXZFuXrEj9XvefDMA-uhc4U7dO-VZek4A",
  baseURL: baseurl,
  clientID: "zj17AAKjTh0ZrdOmD3O7hiXTKc1UwHAy",
  issuerBaseURL: "https://dev-t42orpastoaad3st.us.auth0.com",
};
app.use(
  session({
    secret: "fasfasgdghreyt4wsgsdfsdfwer",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(auth(config));

const ssh = new NodeSSH();
module.exports = { ssh, server, app, bodyParser };

const scriptsRouter = require("./routes/scripts/scripts.js");
const terminalRouter = require("./routes/terminal.js");
const readfileRouter = require("./routes/readfile.js");
const apiRouter = require("./routes/api.js");
const cronjobRouter = require("./routes/cronjobs.js");
const blogRouter = require("./routes/blog/blog.js");
const subRouter = require("./routes/subscription/subscription.js");

app.use("/", scriptsRouter);
app.use("/terminal", terminalRouter);
app.use("/readfile", readfileRouter);
app.use("/api", apiRouter);
app.use("/cronjob", cronjobRouter);
app.use("/blog", blogRouter);
app.use("/subscription", subRouter);


const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

const putConfig = {
  flags: "w", // w - write and a - append
  encoding: null, // use null for binary files
  mode: 0o666, // mode to use for created file (rwx)
  autoClose: true, // automatically close the write stream when finished
};

app.post("/upload", async (req, res) => {
  try {
    ssh.putFile("./kadmin.png", "/root/app/kadmin.png").then(
      function () {
        console.log("The File thing is done");
      },
      function (error) {
        console.log("Something's wrong");
        console.log(error);
      }
    );
  } catch (error) {
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
      res.render("login", { ssh: req.session.sshConfig });
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
  res.render("home", { isauth: req.oidc.isAuthenticated() });
});



 
async function fetchdata(command , req) {
  const server = req.session.server

  const postData = {
    command: command
  };

  const response = await axios.post(`https://kapi.kadmin.online/execute/${server}`, postData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data
     
}








app.get("/dashboard/me", async(req, res) => {

  const server = req.oidc.user.sub || req.session.server

  req.session.server = server

  res.render("partials/test",{server});

});


app.post("/execommand/:server", async (req, res) => {
  const { command } = req.body;

  const user = req.oidc.user.sub
  const postData = {
    command: command
  };

  try {
    const response = await axios.post(`https://kapi.kadmin.online/execute/${user}`, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Response from the server:', response.data);
    // const data = response.data

    res.send(response.data)

  } catch (error) {
    console.error('Error making POST request:', error.response ? error.response.status : error.message);
    // Handle errors as needed, e.g., res.status(500).send('Internal Server Error');
  }
});




app.get("/sandbox", async (req, res) => {
  const servers = req.oidc.user.sub;


  const getUrl = `https://kapi.kadmin.online/user/${servers}`;

  try {
    const responseGet = await axios.get(getUrl);

    if (responseGet.status === 200) {

      console.log('found ');
      res.render('partials/sandbox', { servers: [servers] });
    } else {
      
      
      res.render('partials/sandbox', { servers: [""] });
    }
  } catch (error) {
    console.error(
      `Error fetching data for server ${servers}: ${error.message}`
    );
    console.log('not found ');
    res.render('partials/sandbox', { servers: [""] });

  }


  // try {
    
  //   console.log(servers);
   

  //   const fetchData = async (element) => {
  //     const username = element.split("@")[0];
  //     const getUrl = username ? `https://kapi.kadmin.online/user/${element}` : '';

  //     try {
  //       const responseGet = await axios.get(getUrl);

  //       if (responseGet.status === 200) {
  //         // isexit.push(element);
  //       }else{
  //         const indexToRemove = servers.indexOf(element);
  //         if (indexToRemove !== -1) {
  //           isexit.splice(indexToRemove, 1);
  //         }
  //       }
  //     } catch (error) {
  //       console.error(`Error fetching data for server ${element}: ${error.message}`);
  //       const indexToRemove = servers.indexOf(element);
  //       if (indexToRemove !== -1) {
  //         servers.splice(indexToRemove, 1);
  //       }
  //     }
  //   };

  //   await Promise.all(servers.map(fetchData));

  //   console.log(servers);
  //   res.render('partials/sandbox', { servers });
  // } catch (error) {
  //   // console.error('Error in /sandbox route:', error.message);
  //   console.log(req.session.server);
  //   res.render('partials/sandbox', { servers: [''] });
  // }
});


function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}


app.post('/sandboxconnect', upload.single('privateKey'), async (req, res) => {
  try {
    const { host, user } = req.body;
    const gid = req.oidc.user.sub
    console.log(gid);
    // Access the uploaded file via req.file
    const privateKeyFile = req.file;

    if (!privateKeyFile) {
      return res.status(400).send('No private key uploaded.');
    }

    const id = generateRandomString(20);

    // Create a new FormData object
    const formData = new FormData();
    formData.append('host', host);
    formData.append('user', user);
    formData.append('id', id);
    formData.append('gid', gid);
    formData.append('privateKey', privateKeyFile.buffer, {
      filename: privateKeyFile.originalname,
      contentType: privateKeyFile.mimetype,
    });
   
    

    
    const postUrl = 'https://kapi.kadmin.online/connect'; // Replace with your API endpoint

    // Make the POST request using axios
    const response = await axios.post(postUrl, formData, {
      headers: formData.getHeaders(),
    });
   
    const data = response.data;


    

    const getUrl = 'https://kapi.kadmin.online/connect/' + gid; // Replace with your GET API endpoint
    // console.log(gid);
 
    try {
        const responseGet = await axios.get(getUrl);
        
        if (responseGet.status === 200) {

            // console.log('Request successful:', responseGet.data);
            req.session.server = []
            req.session.server.push(gid+'@'+host)
            // userdb.prepare("UPDATE user SET servers = servers || ? WHERE user = ?").run(',' + id+'@'+host, req.oidc.user.sub);

      

        } else {

            // console.log('Unexpected response status:', responseGet.status);
        }
    } catch (error) {

        console.error('Error making the request:', error.message);
    }

    // const dataFromGet = responseGet.data;




    res.send('File uploaded successfully!'  );
  } catch (error) {
    console.error('Error:', error.message);
    res.send(error.message);
  }




});


app.get("/testapps", async (req, res) => {


  const server = req.session.server

  // const server = user[0].split("@")[0]


  // console.log(user);

  const postData = {
    command: `pm2 jlist | jq -c '.[] | {name, status: .pm2_env.status,id:.pm_id, memory: .monit.memory, cpu: .monit.cpu, repo: .pm2_env.versioning.repo_path}'
    `
  };

  try {
    const response = await axios.post(`https://kapi.kadmin.online/execute/${server}`, postData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });




    // const json = JSON.stringify(response.data)


    const data = response.data.split('\n');
    
    const jsonArray = data.filter(item => item.trim() !== '').map(JSON.parse);


    const scripts = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);

  res.render("partials/testapps", { apps:jsonArray , sysuser, scripts  , server});
    // res.send(response.data)
  } catch (error) {
    console.error('Error making POST request:', error.response ? error.response.status : error.message);
    // Handle errors as needed, e.g., res.status(500).send('Internal Server Error');
  }
});



app.get("/testdash", async (req, res) => {
  res.render("partials/testdashboard")
});

app.get("/testfolders", async (req, res) => {

  try{
    const data = await fetchdata('ls -la' , req)
    const scripts = scriptsdb.prepare("SELECT * FROM scripts WHERE user=?").all(req.oidc.user.sub);
    res.render("partials/testfolders", { folders:data.split('\n')});
  }catch(error){
    console.error('Error making POST request:', error.response ? error.response.status : error.message);

  }

});

app.post("/testchangedic", async (req, res) => {

  const {command} = req.body
  try{
    const data = await fetchdata(command , req)
    const scripts = scriptsdb.prepare("SELECT * FROM scripts WHERE user=?").all(req.oidc.user.sub);
    res.render("partials/testfolders", { folders:data.split('\n')});
  }catch(error){
    console.error('Error making POST request:', error.response ? error.response.status : error.message);

  }

});







app.get("/apps", async (req, res) => {
  try {
    const pm2Result = await ssh.execCommand("pm2 jlist");

    const appList = await processPm2Result(pm2Result);

    const scripts = scriptsdb
      .prepare("SELECT * FROM scripts WHERE user=?")
      .all(req.oidc.user.sub);

    res.render("partials/createapp", { apps: appList, sysuser, scripts });
  } catch (error) {
    res.send(error);
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

var sysuser = "";
app.post("/connect", async (req, res) => {
  const { host, username, password, port, privateKey } = req.body;

  req.session.host = host;
  req.session.username = username;
  req.session.password = password;

  sysuser = username;
  if (!req.session.sshConfig) {
    req.session.sshConfig = {
      host,
      username,
      password,
      port,
      privateKey,
    };
  }

  try {
    await ssh.connect(req.session.sshConfig);

    res.redirect("/dashboard");
  } catch (error) {
    res.send("Failed to connect to the SSH server.", error);
  }
});

const checkSessionVariables = (req, res, next) => {
  if (
    req.path === "/connect" ||
    req.path === "/" ||
    req.path === "/server" ||
    req.path === "/profile" ||
    req.path === "/userinfo" ||
    req.session.sshConfig
  ) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.use(checkSessionVariables);

app.get("/dashboard", async (req, res) => {

  const server =req.session.servers

  const result = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);

  const isuser = userdb
    .prepare("SELECT * FROM user WHERE user=?")
    .all(req.oidc.user.sub);

  console.log(isuser);
  isuser[0].phone
    ? res.render("index.ejs" , { scripts: result, sysuser, user: req.oidc.user, server })
    : res.redirect("/userinfo");
});

app.get("/status", async (req, res) => {
  const result = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);

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
    const { stdout, stderr } = await ssh.execCommand(
      `cd /root/app/controlpanel && git pull`
    );

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
  const { name, phone } = req.body;

  userdb
    .prepare("UPDATE user SET name = ?, phone = ? WHERE user = ?")
    .run(name, phone, req.oidc.user.sub);

  res.redirect("/dashboard");
});

app.get("/profile", requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

server.listen(9111, () => {
  console.log("Server is running on http://localhost:9111");
});
