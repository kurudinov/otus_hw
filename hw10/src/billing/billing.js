// billing.js

const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const prometheus = require('prom-client');

const billingController = require('./controllers/billingController');
require('./controllers/billingKafkaHandler');

const tokenSecretKey = process.env.JWT_SECRET_KEY;

// Инициализация метрик Prometheus
const collectDefaultMetrics = prometheus.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Создание метрик
const httpRequestDuration = new prometheus.Histogram({
    name: 'my_http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5] // buckets in seconds
});

const httpRequestsTotal = new prometheus.Counter({
    name: 'my_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const app = express();

// Middleware для измерения времени запроса
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const route = req.route ? req.route.path : req.path;

        // Записываем метрики
        httpRequestDuration.observe(
            {
                method: req.method,
                route: route,
                status_code: res.statusCode
            },
            duration / 1000
        );

        httpRequestsTotal.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
    });

    next();
});


const PORT = process.env.BILLING_PORT || 8002;

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
                    //console.warn("WARNING: [jwt] JWT verify error: " + JSON.stringify(err));
                } else if (payload && payload.id && payload.email) {
                    req.user = {
                        id: payload.id,
                        email: payload.email,
                        roles: payload.roles
                    };
                    //console.log(`[jwt] token verified for user '${payload.email}'`);
                } else {
                    //console.warn("WARNING: [jwt] token verify error: wrong payload");
                }
            }
        );
    } catch (err) {
        //console.warn("WARNING: [jwt] token verify error: wrong token. Error: " + JSON.stringify(err));
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

// Endpoint для метрик Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    const metrics = await prometheus.register.metrics();
    res.send(metrics);
});

app.listen(PORT, () => {
    console.log(`Billing server is running on port: ${PORT}`);
});