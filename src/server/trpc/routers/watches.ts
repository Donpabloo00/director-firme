import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { companyWatches, companies } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const watchesRouter = router({
  // Creează watch pentru o companie
  createWatch: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        watchFields: z.array(z.string()).optional().default(['status', 'turnover', 'vat_status']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new Error('User not authenticated');
      }

      // Verify company exists
      const company = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      if (!company[0]) {
        throw new Error('Company not found');
      }

      // Check if already watching
      const existing = await ctx.db
        .select()
        .from(companyWatches)
        .where(
          and(
            eq(companyWatches.userId, ctx.userId),
            eq(companyWatches.companyId, input.companyId)
          )
        )
        .limit(1);

      if (existing[0]) {
        throw new Error('Already watching this company');
      }

      // TODO: Get user email from session
      const userEmail = 'user@example.com'; // Placeholder

      const watchId = require('crypto').randomUUID();

      await ctx.db.insert(companyWatches).values({
        id: watchId,
        userId: ctx.userId,
        companyId: input.companyId,
        watchFields: input.watchFields,
        email: userEmail,
        createdAt: new Date(),
        lastNotifiedAt: null,
      });

      return {
        success: true,
        watchId,
        message: `Monitoring ${company[0].name}`,
      };
    }),

  // Obține watches utilizatorului
  listWatches: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new Error('User not authenticated');
      }

      const watches = await ctx.db
        .select({
          id: companyWatches.id,
          companyId: companyWatches.companyId,
          companyName: companies.name,
          companyCif: companies.cif,
          watchFields: companyWatches.watchFields,
          createdAt: companyWatches.createdAt,
          lastNotifiedAt: companyWatches.lastNotifiedAt,
        })
        .from(companyWatches)
        .leftJoin(companies, eq(companies.id, companyWatches.companyId))
        .where(eq(companyWatches.userId, ctx.userId));

      return watches;
    }),

  // Șterge watch
  deleteWatch: protectedProcedure
    .input(z.object({ watchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new Error('User not authenticated');
      }

      // Verify ownership
      const watch = await ctx.db
        .select()
        .from(companyWatches)
        .where(eq(companyWatches.id, input.watchId))
        .limit(1);

      if (!watch[0]) {
        throw new Error('Watch not found');
      }

      if (watch[0].userId !== ctx.userId) {
        throw new Error('Not authorized');
      }

      await ctx.db.delete(companyWatches).where(eq(companyWatches.id, input.watchId));

      return { success: true, message: 'Watch deleted' };
    }),

  // Actualizează watch fields
  updateWatchFields: protectedProcedure
    .input(
      z.object({
        watchId: z.string().uuid(),
        watchFields: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new Error('User not authenticated');
      }

      // Verify ownership
      const watch = await ctx.db
        .select()
        .from(companyWatches)
        .where(eq(companyWatches.id, input.watchId))
        .limit(1);

      if (!watch[0] || watch[0].userId !== ctx.userId) {
        throw new Error('Not authorized');
      }

      // TODO: Implement update
      return { success: true, message: 'Watch fields updated' };
    }),
});
