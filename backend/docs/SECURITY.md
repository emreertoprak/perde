# Security

Helmet, CORS allowlisting, HPP protection, body-size limits, request timeouts, Argon2id, hashed refresh tokens, rate-limit-ready Redis, secure cookies, CSRF design, and generic errors are built in. Never log password, token, authorization, cookie, client-secret, or private-key fields.

Webhook endpoints receive raw JSON, enforce timestamped HMAC-SHA256 signatures, compare signatures in constant time, and use Redis replay keys. File uploads validate binary signatures rather than extensions, enforce a size limit, generate storage keys, and protect private reads by owner authorization.
