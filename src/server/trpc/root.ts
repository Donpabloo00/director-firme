import { router } from './trpc';
import { companiesRouter } from './routers/companies';
import { watchesRouter } from './routers/watches';
import { exportRouter } from './routers/export';

export const appRouter = router({
  companies: companiesRouter,
  watches: watchesRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;

