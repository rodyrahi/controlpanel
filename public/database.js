// ./public/database.js

const fs = require('fs');
const path = require('path');

function listDBFiles(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      // Filter files with .db extension
      const dbFiles = files.filter(file => file.endsWith('.db'));
      resolve(dbFiles);
    });
  });
}

module.exports = { listDBFiles };
