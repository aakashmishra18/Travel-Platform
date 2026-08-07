require("dotenv").config();

const env={
    nodeEnv:process.env.NODE_ENV || "development",
    serviceName:process.env.SERVICE_NAME || "api-gateway",
    port:Number(process.env.PORT) || 8080,
    services:{
        auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
        user: process.env.USER_SERVICE_URL || "http://localhost:3002",
        search: process.env.SEARCH_SERVICE_URL || "http://localhost:3003"
    },
    proxyTimeoutMs:Number(process.env.PROXY_TIMEOUT_MS) || 8000 ,


  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    issuer: process.env.JWT_ISSUER || "travel-os-auth-service",
    audience: process.env.JWT_AUDIENCE || "travel-os-internal",
  },
 
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || null,
 
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 120,
  },
 
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

module.exports=env;