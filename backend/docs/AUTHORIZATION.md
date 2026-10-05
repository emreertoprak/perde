# Authorization

RBAC is represented by roles, permissions, `user_roles`, and `role_permissions`. Seeded roles are `super-admin`, `admin`, and `user`; seeded permissions include user management, role management, and audit log access.

`requireAuth`, `requireRole`, and `requirePermission` execute server-side. Access JWTs do not carry permissions, so authorization remains current after RBAC changes.
