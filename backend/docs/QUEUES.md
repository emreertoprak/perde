# Queues

BullMQ runs in a separate worker process. Mail, audit, analytics, and maintenance queues use retries, exponential backoff, bounded retention, and graceful worker shutdown. API queue producers fail quickly when Redis is unavailable; workers reconnect continuously.

Business transactions write outbox rows first. The worker dispatches them with deterministic job IDs, so duplicate dispatches are safe. Redis must use `maxmemory-policy noeviction` for queue correctness.
