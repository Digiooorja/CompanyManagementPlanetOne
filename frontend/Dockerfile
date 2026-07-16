# Frontend image — see AWS_DEPLOYMENT_GUIDE.md § Docker Compose deployment.
# Multi-stage: build the static bundle with Node, then serve it with Apache httpd.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM httpd:2.4-alpine
COPY --from=build /app/dist /usr/local/apache2/htdocs

# Enable the modules needed for API proxying (mod_proxy/mod_proxy_http) and SPA client-side
# routing fallback (mod_rewrite) — present in this image but commented out by default.
RUN sed -i \
      -e 's/^#LoadModule proxy_module/LoadModule proxy_module/' \
      -e 's/^#LoadModule proxy_http_module/LoadModule proxy_http_module/' \
      -e 's/^#LoadModule rewrite_module/LoadModule rewrite_module/' \
      /usr/local/apache2/conf/httpd.conf \
    && echo 'Include conf/extra/planetone.conf' >> /usr/local/apache2/conf/httpd.conf

COPY apache.conf /usr/local/apache2/conf/extra/planetone.conf

EXPOSE 80
