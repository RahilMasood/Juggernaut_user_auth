const Joi = require('joi');

/**
 * Middleware to validate request body/query/params against a Joi schema
 * @param {Object} schema - Joi schema object with body, query, and/or params
 */
function validate(schema) {
  return (req, res, next) => {
    const toValidate = {};
    
    if (schema.body) toValidate.body = req.body;
    if (schema.query) toValidate.query = req.query;
    if (schema.params) toValidate.params = req.params;

    const validationSchema = Joi.object(schema);
    const { error, value } = validationSchema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details
        }
      });
    }

    // Replace request data with validated data
    if (schema.body) req.body = value.body;
    if (schema.query) req.query = value.query;
    if (schema.params) req.params = value.params;

    next();
  };
}

module.exports = validate;

