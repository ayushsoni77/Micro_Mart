import client from 'prom-client';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import Pyroscope from '@pyroscope/nodejs';

export async function initializeObservability({ serviceName }) {
  const metricsPrefix = `${serviceName.replace(/[^a-zA-Z0-9]/g, '_')}_`;
  const register = new client.Registry();

  client.collectDefaultMetrics({
    register,
    prefix: metricsPrefix
  });

  const httpRequestsTotal = new client.Counter({
    name: `${metricsPrefix}http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  const httpRequestDurationSeconds = new client.Histogram({
    name: `${metricsPrefix}http_request_duration_seconds`,
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
  });

  register.registerMetric(httpRequestsTotal);
  register.registerMetric(httpRequestDurationSeconds);

  process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || serviceName;

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
  });

  const otelSdk = new NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  await otelSdk.start();

  Pyroscope.init({
    appName: process.env.PYROSCOPE_APP_NAME || serviceName,
    serverAddress: process.env.PYROSCOPE_SERVER_ADDRESS || 'http://localhost:4040',
    tags: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development'
    }
  });
  Pyroscope.start();

  const metricsMiddleware = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const route = req.route?.path || req.path || 'unknown';
      const statusCode = String(res.statusCode);
      const labels = { method: req.method, route, status_code: statusCode };

      httpRequestsTotal.inc(labels);

      const durationInSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      httpRequestDurationSeconds.observe(labels, durationInSeconds);
    });

    next();
  };

  const registerMetricsEndpoint = (app) => {
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });
  };

  const shutdown = async () => {
    await otelSdk.shutdown();
  };

  return {
    metricsMiddleware,
    registerMetricsEndpoint,
    shutdown
  };
}
