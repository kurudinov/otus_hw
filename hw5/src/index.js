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