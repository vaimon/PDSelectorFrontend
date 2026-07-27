# Build stage: install deps, build the Vite bundle. VITE_BACKEND_URL is baked in at build
# time (Vite inlines import.meta.env) — a build-arg, not runtime env. Empty default = same-origin
# (prod, behind the edge nginx on teams.pd-mmcs.ru); set to the backend origin for other setups.
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
COPY . .
RUN npm run build

# Runtime stage: static bundle served by nginx. Same version as the edge proxy for parity.
# TLS terminates upstream at the edge nginx, so this is plain HTTP.
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1
