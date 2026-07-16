# Backend API image — see AWS_DEPLOYMENT_GUIDE.md § Docker Compose deployment.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Secrets/config are injected at runtime via docker-compose's env_file/environment — never baked in.
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
