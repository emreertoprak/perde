# Observability

Pino writes structured, redacted logs to stdout with request and correlation IDs. Grafana Alloy collects container stdout and sends it to Loki. Loki failure never blocks API work.

Sentry initializes only with a DSN and strips authorization/cookie data. PostHog initializes only with an API key and honors analytics opt-out. Prometheus metrics are exposed at `/metrics`; production requests require the configured bearer token.
