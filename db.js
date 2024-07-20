// db.js

const mysql = require('mysql');

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10, // adjust according to your database needs
  host: 'localhost',
  user: 'root',
  password: '',
  database: "crime_project"
});

module.exports = pool;
