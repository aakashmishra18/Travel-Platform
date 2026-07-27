const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const requestId = require('./middleware/requestId');
const verifyInternalCaller = require('./middleware/verifyInternalCaller');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const logger = require('./utils/logger');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use(requestId);
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Liveness/readiness probe - intentionally unauthenticated and unlimited.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Every /internal route is only reachable from the API Gateway (or other
// trusted internal callers holding the shared service token).
app.use('/internal/v1/auth', verifyInternalCaller, generalLimiter, authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;