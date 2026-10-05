# Authentication

Email/password registration creates the user, assigns `user`, records an audit event, creates a hashed verification token, and writes an encrypted mail action to the transactional outbox. Login uses Argon2id, temporary lockout after five failed attempts, and creates a session family.

Access tokens expire after 15 minutes. Refresh tokens expire after 30 days, are signed with issuer/audience checks, and are hashed in PostgreSQL. Refresh rotation creates a replacement session and revokes the old session; invalid, revoked, or reused tokens revoke the family.

Google and Apple credentials are validated only when their flags are enabled. Providers must use authorization code, PKCE, state, and nonce. Provider e-mail is never used for automatic linking. Configure provider callback URLs and use a real OIDC credential set before enabling either flag.
