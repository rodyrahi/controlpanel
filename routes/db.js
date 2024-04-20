const Database = require('better-sqlite3');

const userdb = new Database('../database/kadmin/userdb.db');
const scriptsdb = new Database('../database/kadmin/scriptsdb.db');
const blogsdb = new Database('../database/kadmin/blogsdb.db');
const systemdb = new Database('../database/kadmin/systemdb.db');

userdb.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    email TEXT,
    phone INTEGER,
    name TEXT,
    plan,
    expire DATE,
    data TEXT,

    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

scriptsdb.exec(`
  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    name TEXT,
    script TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


blogsdb.exec(`
  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT,
    tittle TEXT,
    body TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
blogsdb.exec(`
  CREATE TABLE IF NOT EXISTS blogimages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blog INTEGER,
    image BLOB,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

systemdb.exec(`
CREATE TABLE IF NOT EXISTS systemcommands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  command TEXT,
  system TEXT
);



`);


systemdb.exec(`
INSERT INTO systemcommands (name, command, system)
SELECT commands.name, commands.command, commands.system FROM (
  SELECT 'restart-pm2-app' as name, 'pm2 restart $$$' as command, 'linux' as system
  UNION ALL SELECT 'change-directory', 'cd $$$', 'linux'
  UNION ALL SELECT 'list-directories', 'ls -la', 'linux'
  UNION ALL SELECT 'create-directory', 'mkdir $$$', 'linux'
  UNION ALL SELECT 'remove-directory', 'rm -rf $$$', 'linux'
  UNION ALL SELECT 'create-file', 'touch $$$', 'linux'
  UNION ALL SELECT 'delete-pm2-app', 'pm2 delete $$$', 'linux'
  UNION ALL SELECT 'stop-pm2-app', 'pm2 stop $$$', 'linux'
  UNION ALL SELECT 'start-pm2-app', 'pm2 start $$$', 'linux'
  UNION ALL SELECT 'list-pm2-apps', 'pm2 list', 'linux'
  UNION ALL SELECT 'list-pm2-logs', 'pm2 logs $$$ --stream', 'linux'
  UNION ALL SELECT 'restart-nginx', 'sudo systemctl restart nginx', 'linux'
  UNION ALL SELECT 'start-nginx', 'sudo systemctl start nginx', 'linux'
) AS commands
LEFT JOIN systemcommands ON commands.name = systemcommands.name
WHERE systemcommands.name IS NULL;
`);


console.log('Connected to the database');

module.exports = { userdb, scriptsdb , blogsdb , systemdb };
