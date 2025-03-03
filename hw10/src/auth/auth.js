// index.js (auth)

const express = require('express');
const authController = require('./controllers/authController');
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const prometheus = require('prom-client');

// env
const PORT = process.env.AUTH_PORT || 8001;

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

// Endpoint для метрик Prometheus
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    const metrics = await prometheus.register.metrics();
    res.send(metrics);
});

// start server
app.listen(PORT, () => {
    console.log(`Auth server is running on port: ${PORT}`);
});
