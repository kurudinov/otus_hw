// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

const promClient = require('prom-client');
//const metricExporter = require('./controllers/metricsController');

// Initialize metrics
const registry = new promClient.Registry();
metricsController(registry);

//Routes
//router.get('/', metricsController.getStatus);

// Report Prometheus metrics on /metrics
router.get('/', async (req, res, next) => {
    res.set('Content-Type', registry.contentType);
    res.end(registry.metrics());
    
    next();
  });

module.exports = router;