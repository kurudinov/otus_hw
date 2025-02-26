// erp.js

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');

require('./controllers/erpKafkaHandler');

const erpController = require('./controllers/erpController.js');

const tokenSecretKey = process.env.JWT_SECRET_KEY;


const app = express();
const PORT = process.env.ERP_PORT || 8005;

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
                    console.warn("WARNING: [jwt] JWT verify error: " + JSON.stringify(err));
                } else if (payload && payload.id && payload.email) {
                    req.user = {
                        id: payload.id,
                        email: payload.email,
                        roles: payload.roles
                    };
                    console.log(`[jwt] token verified for user '${payload.email}'`);
                } else {
                    console.warn("WARNING: [jwt] token verify error: wrong payload");
                }
            }
        );
    } catch (err) {
        console.warn("WARNING: [jwt] token verify error: wrong token. Error: " + JSON.stringify(err));
    }

    next();
});



// routes
app.get('/erp/products', erpController.getProducts);
app.post('/erp/calcPrice', erpController.calcPrice);
// app.post('/erp/orders', erpController.createErpOrder);
// app.get('/erp/orders/:id', erpController.getErpOrder);

app.get('/erp/health', (req, res) => {
    res.status(200).json({ status: `OK` });
});

app.listen(PORT, () => {
    console.log(`ERP server is running on port: ${PORT}`);
});