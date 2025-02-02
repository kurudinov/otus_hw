// index.js
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const healthRoutes = require("./routes/healthRoutes");
//const errorMiddleware = require("./middleware/errorHandler");
require("dotenv").config();
const db = require('./config/db');

// console.log('Connecting to the database');
// console.log(`  DB_HOST: ${process.env.DB_HOST}`);
// console.log(`  DB_NAME: ${process.env.DB_NAME}`);
// console.log(`  DB_USER: ${process.env.DB_USER}`);
// db.query('SELECT NOW()', (err, res) => {
//   if(err) {
//     console.error('Error connecting to the database', err.stack);
//   } else {
//     console.log('Connected to the database', res.rows);
//   }
// });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(helmet());
app.use(morgan("common"));
app.use(cors());

// Routes
app.use("/users", userRoutes);
app.use("/health", healthRoutes);

// Error middleware (not used yet)
//app.use(errorMiddleware);

// Start the server
app.listen(PORT, () => {
  console.log(`My server is running on http://localhost:${PORT}`);
});
