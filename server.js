const http = require("http");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { NodeSSH } = require("node-ssh");
const server = http.createServer(app);
const { userdb, scriptsdb } = require("./routes/db.js");
const path = require("path");
const fs = require("fs");
const { auth, requiresAuth } = require("express-openid-connect");
const multer = require("multer");
const FormData = require("form-data");
const { Client } = require('ssh2');



const axios = require("axios");
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

app.use(auth(config));
app.use(
  session({
    secret: "fasfasgdghreyt4wsgsdfsdfwer",
    store: new FileStore({
      path: "/session/kadmin",
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
    },
  })
);

const ssh = new Client();
module.exports = { ssh, server, app, bodyParser };

const scriptsRouter = require("./routes/scripts/scripts.js");
const terminalRouter = require("./routes/terminal.js");
const readfileRouter = require("./routes/readfile.js");
// const apiRouter = require("./routes/api.js");
const cronjobRouter = require("./routes/cronjobs.js");
const blogRouter = require("./routes/blog/blog.js");
const subRouter = require("./routes/subscription/subscription.js");

app.use("/", scriptsRouter);
app.use("/terminal", terminalRouter);
app.use("/readfile", readfileRouter);
// app.use("/api", apiRouter);
app.use("/cronjob", cronjobRouter);
app.use("/blog", blogRouter);
app.use("/subscription", subRouter);

// const storage = multer.memoryStorage();


const putConfig = {
  flags: "w", // w - write and a - append
  encoding: null, // use null for binary files
  mode: 0o666, // mode to use for created file (rwx)
  autoClose: true, // automatically close the write stream when finished
};

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});



// Use temporary storage for multer
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  const path = req.body.path;

  console.log(path);
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const remoteFilePath = `${path}${req.file.originalname}`;

    

    ssh.sftp((err, sftp) => {
      if (err) {
        console.error('SFTP Error:', err);
        res.status(500).json({ message: 'SFTP error' });
        ssh.end();
        return;
      }

      // Create a read stream from the buffer
      const readStream = require('stream').Readable.from(req.file.buffer);
      const writeStream = sftp.createWriteStream(remoteFilePath);

      writeStream.on('close', () => {
        console.log('- File transferred successfully');
        res.status(200).json({ message: 'File uploaded successfully' });
        ssh.end();
      });

      writeStream.on('error', (writeErr) => {
        console.error('Error while writing to SFTP:', writeErr);
        res.status(500).json({ message: 'File upload failed' });
        ssh.end();
      });

      // Start the file transfer from buffer
      readStream.pipe(writeStream);


    });


  ssh.on('error', (connErr) => {
    console.error('SSH Connection Error:', connErr);
    res.status(500).json({ message: 'SSH connection error' });
  });

 
});







app.get("/", (req, res) => {
  res.render("home", { isauth: req.oidc.isAuthenticated() });
});

async function fetchdata(command, req) {
  const server = req.session.server;

  const postData = {
    command: command,
  };

  const response = await axios.post(
    `https://api.kadmin.online/execute/${server}`,
    postData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

app.get("/dashboard", async (req, res) => {

  ssh.connect(req.session.sshConfig);



  console.log(req.oidc.user);
  const server = req.oidc.user.sub || req.session.server;

  req.session.server = server;

  // const responseGet = await axios.get(getUrl);
  const username = await axios.get(
    `https://api.kadmin.online/username/${server}`
  );

  // console.log(username.data.data.User);
  res.render("partials/test", { server, username: username.data.data });
});

app.post("/execommand/:server", async (req, res) => {
  const { command } = req.body;

  const user = req.oidc.user.sub;
  const postData = {
    command: command,
  };

  try {
    const response = await axios.post(
      `https://api.kadmin.online/execute/${user}`,
      postData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("Response from the server:", response.data);
    // const data = response.data

    res.send(response.data);
  } catch (error) {
    console.error(
      "Error making POST request:",
      error.response ? error.response.status : error.message
    );
    // Handle errors as needed, e.g., res.status(500).send('Internal Server Error');
  }
});

app.get("/server", requiresAuth(), async (req, res) => {
  const servers = req.oidc.user.sub;

  const getUrl = `https://api.kadmin.online/user/${servers}`;

  try {
    const responseGet = await axios.get(getUrl);

    if (responseGet.status === 200 && req.session.sshConfig) {
      console.log("found ");
      res.render("partials/sandbox", {
        servers: [servers],
        user: req.oidc.user,
      });
    } else {
      res.render("partials/sandbox", { servers: [""], user: req.oidc.user });
    }
  } catch (error) {
    console.error(
      `Error fetching data for server ${servers}: ${error.message}`
    );
    console.log("not found ");
    res.render("partials/sandbox", { servers: [""], user: req.oidc.user });
  }
});

function generateRandomString(length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

app.post("/sandboxconnect", upload.single("privateKey"), async (req, res) => {
  try {
    const { host, user, port } = req.body;

    const gid = req.oidc.user.sub;
    console.log(req.file);
    // Access the uploaded file via req.file
    const privateKeyFile = req.file;

    if (!privateKeyFile) {
      return res.status(400).send("No private key uploaded.");
    }

    const id = generateRandomString(20);

    // Create a new FormData object
    const formData = new FormData();
    formData.append("host", host);
    formData.append("user", user);
    formData.append("id", id);
    formData.append("gid", gid);
    formData.append("privateKey", privateKeyFile.buffer, {
      filename: privateKeyFile.originalname,
      contentType: privateKeyFile.mimetype,
    });

    req.session.sshConfig = {
      host,
      username: user,
      port,
      privateKey: privateKeyFile.buffer.toString(),
    };

    const postUrl = "https://api.kadmin.online/connect"; // Replace with your API endpoint

    // Make the POST request using axios
    const response = await axios.post(postUrl, formData, {
      headers: formData.getHeaders(),
    });

    const data = response.data;

    const getUrl = "https://api.kadmin.online/connect/" + gid;
    console.log(getUrl);

    try {
      const responseGet = await axios.get(getUrl);

      console.log(responseGet.data);
      if (responseGet.status === 200) {
        req.session.server = [];
        req.session.server.push(gid + "@" + host);
      } else {
        console.log("Unexpected response status:", responseGet.status);
      }
    } catch (error) {
      console.error("Error making the request:", error.message);
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error:", error.message);
    res.send(error.message);
  }
});

app.get("/testapps", async (req, res) => {
  const server = req.session.server;

  // const server = user[0].split("@")[0]

  // console.log(user);

  const postData = {
    command: `pm2 jlist | jq -c '.[] | {name, status: .pm2_env.status,id:.pm_id, memory: .monit.memory, cpu: .monit.cpu, repo: .pm2_env.versioning.repo_path}'
    `,
  };

  try {
    const response = await axios.post(
      `https://api.kadmin.online/execute/${server}`,
      postData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // const json = JSON.stringify(response.data)

    const data = response.data.split("\n");

    const jsonArray = data.filter((item) => item.trim() !== "").map(JSON.parse);

    const scripts = scriptsdb
      .prepare("SELECT * FROM scripts WHERE user=?")
      .all(req.oidc.user.sub);

    res.render("partials/testapps", {
      apps: jsonArray,
      sysuser,
      scripts,
      server,
    });
    // res.send(response.data)
  } catch (error) {
    console.error(
      "Error making POST request:",
      error.response ? error.response.status : error.message
    );
    // Handle errors as needed, e.g., res.status(500).send('Internal Server Error');
  }
});

app.get("/testdash", async (req, res) => {
  res.render("partials/testdashboard");
});

app.get("/testfolders", async (req, res) => {
  try {
    const data = await fetchdata("ls -la", req);
    const scripts = scriptsdb
      .prepare("SELECT * FROM scripts WHERE user=?")
      .all(req.oidc.user.sub);
    console.log(scripts);
    res.render("partials/testfolders", { folders: data.split("\n"), scripts });
  } catch (error) {
    console.error(
      "Error making POST request:",
      error.response ? error.response.status : error.message
    );
  }
});

app.get("/testfileditor", async (req, res) => {
  res.render("partials/testfileditor");
});

app.post("/testchangedic", async (req, res) => {
  const { command } = req.body;
  try {
    const data = await fetchdata(command, req);
    const scripts = scriptsdb
      .prepare("SELECT * FROM scripts WHERE user=?")
      .all(req.oidc.user.sub);
    res.render("partials/testfolders", { folders: data.split("\n"), scripts });
  } catch (error) {
    console.error(
      "Error making POST request:",
      error.response ? error.response.status : error.message
    );
  }
});

app.get("/testcreatewebsite", async (req, res) => {
  res.render("partials/testcreatewebsite");
});

app.get("/testscripts", async (req, res) => {
  const scripts = scriptsdb
    .prepare("SELECT * FROM scripts WHERE user=?")
    .all(req.oidc.user.sub);
  res.render("partials/testscripts", { scripts });
});

app.post("/testcreatescript", (req, res) => {
  const { scriptname, script, id } = req.body;

  const result = scriptsdb.prepare("SELECT * FROM scripts WHERE id= ?").get(id);

  if (!result) {
    scriptsdb
      .prepare(`INSERT INTO scripts (name , script ,user) VALUES (?,? ,?) `)
      .run(scriptname, script, req.oidc.user.sub);
  } else {
    scriptsdb
      .prepare("UPDATE scripts SET name = ?, script = ? WHERE id = ? ")
      .run(scriptname, script, id);
  }

  console.log("done");
  res.redirect("/testscripts");
});

app.get("/testdeletescript/:id", (req, res) => {
  const id = req.params.id;

  // Assuming you have a database connection and a table named 'scripts'
  scriptsdb.prepare("DELETE FROM scripts WHERE id = ?").run(id);

  res.redirect("/testscripts"); // Redirect to the scripts page after successful deletion
});

app.get("/monitor", async (req, res) => {
  const server = req.oidc.user.sub;
  res.render("partials/monitor", { server });
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
    req.path === "/createwebsite.sh" ||
    req.session.sshConfig 
  ) {

    next();
  } else {
    res.redirect("/login");
  }
};

app.use(checkSessionVariables);

// app.get("/dashboard", async (req, res) => {

//   const server =req.session.servers

//   const result = scriptsdb
//     .prepare("SELECT * FROM scripts WHERE user=?")
//     .all(req.oidc.user.sub);

//   const isuser = userdb
//     .prepare("SELECT * FROM user WHERE user=?")
//     .all(req.oidc.user.sub);

//   console.log(isuser);
//   isuser[0].phone
//     ? res.render("index.ejs" , { scripts: result, sysuser, user: req.oidc.user, server })
//     : res.redirect("/userinfo");
// });

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
