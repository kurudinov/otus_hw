// billing.js

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');

const billingController = require('./controllers/billingController');
require('./controllers/billingKafkaHandler');

const tokenSecretKey = process.env.JWT_SECRET_KEY;


const app = express();
const BILLING_PORT = process.env.BILLING_PORT || 8002;

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(cookieParser());

app.use((req, res, next) => {
    try {
        var token = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[1]) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.access_token) {
            token = req.cookies.access_token;
        }

        jwt.verify(
            token,
            tokenSecretKey,
            (err, payload) => {
                if (err) {
                    console.error("JWT verify error: " + JSON.stringify(err));
                } else if (payload && payload.id && payload.email) {
                    req.user = {
                        id: payload.id,
                        email: payload.email,
                        roles: payload.roles
                    };
                    console.log(`token verified for user ${payload.email}`);
                } else {
                    console.error("JWT verify error: wrong payload");
                }
            }
        );
    } catch (err) {
        console.error("JWT verify error: wrong token. Error: " + JSON.stringify(err));
    }

    next();
});



// routes
app.post('/billing/addBalance', billingController.addUserBalance);
app.get('/billing/myBalance', billingController.getUserBalance);
app.get('/billing/myTransactions', billingController.getUserTransactions);
app.get('/billing/health', (req, res) => {
    res.status(200).json({ status: `OK` });
});

app.listen(BILLING_PORT, () => {
    console.log(`Auth server is running on port: ${BILLING_PORT}`);
});