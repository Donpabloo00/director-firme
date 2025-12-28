import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
// TODO: Re-enable middleware după ce e fixat auth
// import { auditMiddleware } from './middleware/audit';
// import { rateLimitMiddleware } from './middleware/rateLimit';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Nu expunem stack trace în producție
        stack: process.env.NODE_ENV === 'development' ? shape.data.stack : undefined,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure; // TODO: Adaugă middleware înapoi

// Protected procedure - requires authentication
// TODO: Re-enable middleware când e nevoie
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Now guaranteed to be defined
    },
  });
});

