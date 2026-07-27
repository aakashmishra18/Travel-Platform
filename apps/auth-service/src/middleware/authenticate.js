const TokenService = require('../services/token.service');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the caller's access token for endpoints the API Gateway
 * proxies through as-is (e.g. GET /me, change-password, sessions).
 * The gateway is expected to forward the client's Authorization header
 * unmodified for these internal routes.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, sessionId: payload.sid };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;