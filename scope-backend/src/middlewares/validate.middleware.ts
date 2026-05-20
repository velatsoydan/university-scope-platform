import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';

/**
 * Wraps a Zod schema into an Express middleware that validates
 * `{ body, query, params }` against it. On failure, returns a 400 with a
 * crash-proof JSON envelope; on any other thrown value, passes through to
 * the global error handler.
 *
 * Notes on robustness:
 *  - In Zod 4 the issue list lives on `.issues` (the Zod 3 `.errors` alias
 *    was removed), so we read `.issues` and fall back to `[]` defensively.
 *  - We strip the leading `body`/`query`/`params` segment from the path so
 *    field names match the client payload shape.
 *  - We surface the first issue's message as `error` (single string) AND the
 *    full breakdown as `errors` (array), so consumers reading either key get
 *    something usable.
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const issues = Array.isArray(error.issues) ? error.issues : [];

        const details = issues.map((issue) => {
          const path = Array.isArray(issue.path) ? issue.path : [];
          // Drop the leading `body`/`query`/`params` segment so the client
          // sees `title` instead of `body.title`.
          const cleaned = (path.length > 1 && ['body', 'query', 'params'].includes(String(path[0])))
            ? path.slice(1)
            : path;
          return {
            field: cleaned.join('.') || '(root)',
            message: issue.message || 'Invalid value',
          };
        });

        const firstMessage = details[0]?.message ?? 'Validation failed';

        res.status(400).json({
          // `error` (single string) — matches the rest of the API's error
          // envelope so frontends that read `body.error` show something useful.
          error: firstMessage,
          // `message` + `errors` — keeps the structured breakdown for
          // debugging and for clients that want field-level detail.
          message: 'Validation failed',
          errors: details,
        });
        return;
      }
      next(error);
    }
  };
};
