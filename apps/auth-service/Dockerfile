services:
  postgres:
    image: postgres:16-alpine
    container_name: travelos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  auth-service:
    build:
      context: ./auth-service
    container_name: travelos-auth-service
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    # Run the (idempotent) schema migration once, then start the server.
    # Fine for local dev; in a real deployment run migrations as a
    # separate one-off job instead of on every container start.
    command: sh -c "node src/db/migrate.js && node src/server.js"
    environment:
      NODE_ENV: development
      PORT: 3001
      SERVICE_NAME: auth-service

      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_ACCESS_EXPIRES_IN: 15m
      JWT_REFRESH_EXPIRES_IN: 30d
      JWT_ISSUER: ${JWT_ISSUER}
      JWT_AUDIENCE: ${JWT_AUDIENCE}

      INTERNAL_SERVICE_TOKEN: ${INTERNAL_SERVICE_TOKEN}

      BCRYPT_SALT_ROUNDS: 12
      MAX_FAILED_LOGIN_ATTEMPTS: 5
      LOCKOUT_DURATION_MINUTES: 15
      EMAIL_VERIFICATION_TOKEN_TTL_MIN: 1440
      PASSWORD_RESET_TOKEN_TTL_MIN: 30

      RATE_LIMIT_WINDOW_MS: 60000
      RATE_LIMIT_MAX_REQUESTS: 100
      LOGIN_RATE_LIMIT_WINDOW_MS: 900000
      LOGIN_RATE_LIMIT_MAX_REQUESTS: 10
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  api-gateway:
    build:
      context: ./api-gateway
    container_name: travelos-api-gateway
    restart: unless-stopped
    depends_on:
      auth-service:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: 8080
      SERVICE_NAME: api-gateway

      # Service name, not localhost - containers reach each other by
      # their compose service name on the shared network.
      AUTH_SERVICE_URL: http://auth-service:3001
      PROXY_TIMEOUT_MS: 8000

      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_ISSUER: ${JWT_ISSUER}
      JWT_AUDIENCE: ${JWT_AUDIENCE}

      INTERNAL_SERVICE_TOKEN: ${INTERNAL_SERVICE_TOKEN}

      RATE_LIMIT_WINDOW_MS: 60000
      RATE_LIMIT_MAX_REQUESTS: 120

      CORS_ALLOWED_ORIGINS: http://localhost:3000
    ports:
      - "8080:8080"

volumes:
  pgdata: