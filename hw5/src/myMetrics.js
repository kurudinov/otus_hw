require("dotenv").config();

const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const sdk = new opentelemetry.NodeSDK({
  metricReader: new PrometheusExporter({
    port: process.env.METRIC_PORT || 9464
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();