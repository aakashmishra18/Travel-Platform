const ApiError = require('../utils/ApiError');

/**
 * Validates req.body (default) or another request part against a Joi
 * schema. Strips unknown keys and returns all validation errors at once.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;