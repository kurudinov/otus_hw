// index.js (auth)

const express = require('express');
const authController = require('./controllers/authController');
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// env
const AUTH_PORT = process.env.AUTH_PORT || 8001;

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Routes
app.post('/auth/register', authController.registerUser);
app.post('/auth/getToken', authController.getToken);
app.get('/auth/logout', authController.logout);
app.get('/auth/health', (req, res) => {
    res.status(200).json({ status: `OK` });
});

// start server
app.listen(AUTH_PORT, () => {
    console.log(`Auth server is running on port: ${AUTH_PORT}`);
});
