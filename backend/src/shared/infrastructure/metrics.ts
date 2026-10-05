import type { RequestHandler } from 'express';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export class MetricsService {
  public readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });
  private readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });
  public constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  public middleware(): RequestHandler {
    return (request, response, next) => {
      const started = process.hrtime.bigint();
      response.on('finish', () => {
        const route = request.path;
        const labels = { method: request.method, route, status_code: String(response.statusCode) };
        const duration = Number(process.hrtime.bigint() - started) / 1_000_000_000;
        this.httpRequests.inc(labels);
        this.httpDuration.observe(labels, duration);
      });
      next();
    };
  }

  public async render(): Promise<string> {
    return this.registry.metrics();
  }
}
