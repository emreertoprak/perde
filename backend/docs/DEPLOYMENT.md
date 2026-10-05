# Deployment

Build the production Docker target, run the explicit migration command once per release, then start API and worker separately. The image is multi-stage and non-root. Nginx is an example reverse proxy; terminate TLS at the ingress and set trusted proxy configuration deliberately.

The PM2 ecosystem file is for non-container deployments. Do not run multiple process managers in one container.
