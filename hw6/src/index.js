// index.js

const express = require("express");
//const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const healthRoutes = require("./routes/healthRoutes");
//const errorMiddleware = require("./middleware/errorHandler");
require("dotenv").config();

const userController = require('./controllers/userController');


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());

// Routes
app.use("/users", userRoutes);
app.use("/health", healthRoutes);

app.use("/users", userRoutes);

app.get('/myUserProfile', userController.getCurrentUserProfile);
app.put('/myUserProfile', userController.checkAndUpdateCurrentUserProfile);

// Error middleware (not used yet)
//app.use(errorMiddleware);

// Start the server
app.listen(PORT, () => {
  console.log(`App server is running on port: ${PORT}`);
});