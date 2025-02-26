const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log('Connecting to the database');
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
console.log(`  DB_USER: ${process.env.DB_USER}`);

db.query('SELECT NOW()', (err, res) => {
  if(err) {
    console.error('\x1b[31mERROR:\x1b[0m Error connecting to the database', err.stack);
  } else {
    console.log('Connected to the database', res.rows);
  }
});

module.exports = db;