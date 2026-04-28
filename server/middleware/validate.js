// Zod validation middleware
import { ZodError } from 'zod';

/**
 * Validation middleware factory using Zod schemas.
 *
 * @param {Object} schemas - Object containing Zod schemas for different parts of the request
 * @param {import('zod').ZodSchema} [schemas.body] - Schema for req.body
 * @param {import('zod').ZodSchema} [schemas.query] - Schema for req.query
 * @param {import('zod').ZodSchema} [schemas.params] - Schema for req.params
 * @returns Express middleware
 *
 * Usage:
 *   import { z } from 'zod';
 *   const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
 *   router.post('/login', validate({ body: schema }), handler);
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid input'
      });
    }
  };
}

export default validate;
