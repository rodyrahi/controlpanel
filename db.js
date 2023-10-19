const Database = require('better-sqlite3');

const userdb = new Database('../database/kadmin/userdb.db');
const scriptsdb = new Database('../database/kadmin/scriptsdb.db');

userdb.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    mail TEXT,
    expire DATE,
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

console.log('Connected to the database');

module.exports = { userdb, scriptsdb };
