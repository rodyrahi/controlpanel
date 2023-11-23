const Database = require('better-sqlite3');

const userdb = new Database('../database/kadmin/userdb.db');
const scriptsdb = new Database('../database/kadmin/scriptsdb.db');
const blogsdb = new Database('../database/kadmin/blogsdb.db');


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

console.log('Connected to the database');

module.exports = { userdb, scriptsdb , blogsdb };
