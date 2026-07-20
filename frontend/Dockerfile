# Frontend image — see AWS_DEPLOYMENT_GUIDE.md § Docker Compose deployment.
# Multi-stage: build the static bundle with Node, then serve it with Apache httpd.
#
# The repo root is an npm workspaces project with "frontend" as its only workspace member —
# there is no frontend/package-lock.json, the lockfile lives at the repo root. So this build
# needs the repo root as its build context (see docker-compose.yml: context: ., dockerfile:
# frontend/Dockerfile) rather than ./frontend, so `npm ci` can see the root lockfile.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci
COPY frontend ./frontend
RUN npm run build --workspace=frontend

FROM httpd:2.4-alpine
COPY --from=build /app/frontend/dist /usr/local/apache2/htdocs

# Enable the modules needed for API proxying (mod_proxy/mod_proxy_http) and SPA client-side
# routing fallback (mod_rewrite) — present in this image but commented out by default.
RUN sed -i \
      -e 's/^#LoadModule proxy_module/LoadModule proxy_module/' \
      -e 's/^#LoadModule proxy_http_module/LoadModule proxy_http_module/' \
      -e 's/^#LoadModule rewrite_module/LoadModule rewrite_module/' \
      /usr/local/apache2/conf/httpd.conf \
    && echo 'Include conf/extra/planetone.conf' >> /usr/local/apache2/conf/httpd.conf

COPY frontend/apache.conf /usr/local/apache2/conf/extra/planetone.conf

EXPOSE 80
