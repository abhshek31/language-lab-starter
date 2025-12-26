const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'language_lab',
  password: 'Labpass@123',
  database: 'language_lab',
  waitForConnections: true,
  connectionLimit: 10,
});
module.exports = pool;

