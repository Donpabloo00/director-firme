import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { companies, shareholders, legalCases, financialData, fiscalStatus, sourceProvenance } from '@/server/db/schema';
import { eq, ilike, or, and, desc } from 'drizzle-orm';

export const companiesRouter = router({
  // Căutare companie după CIF sau nume
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(500), // Query is required and must be at least 1 character
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { query, limit, offset } = input;
        
        if (!ctx?.db) {
          console.error('Database connection not available in context');
          return {
            companies: [],
            total: 0,
            limit,
            offset,
          };
        }
        
        // Escape special characters pentru SQL LIKE
        const escapedQuery = query.replace(/[%_\\]/g, '\\$&');
        
        const results = await ctx.db
          .select()
          .from(companies)
          .where(
            or(
              ilike(companies.cif, `%${escapedQuery}%`),
              ilike(companies.name, `%${escapedQuery}%`)
            )
          )
          .limit(limit)
          .offset(offset)
          .orderBy(desc(companies.lastUpdated));

        const totalCount = await ctx.db
          .select({ count: companies.id })
          .from(companies)
          .where(
            or(
              ilike(companies.cif, `%${escapedQuery}%`),
              ilike(companies.name, `%${escapedQuery}%`)
            )
          );

        return {
          companies: results || [],
          total: totalCount.length || 0,
          limit,
          offset,
        };
      } catch (error) {
        console.error('Search error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        // Returnează răspuns gol în loc să arunce eroare
        return {
          companies: [],
          total: 0,
          limit: input.limit,
          offset: input.offset,
        };
      }
    }),

  // Obține detalii complete despre o companie
  getByCif: publicProcedure
    .input(z.object({ cif: z.string().min(1).max(20) }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.cif, input.cif))
        .limit(1);

      if (!company[0]) {
        throw new Error('Company not found');
      }

      const [
        companyShareholders,
        companyLegalCases,
        // companyHistoryData, // TODO: companyHistory table not implemented yet
        companyFinancials,
        companyFiscal,
        companySources
      ] = await Promise.all([
        ctx.db.select().from(shareholders).where(eq(shareholders.companyId, company[0].id)),
        ctx.db
          .select()
          .from(legalCases)
          .where(eq(legalCases.companyId, company[0].id))
          .orderBy(desc(legalCases.startDate))
          .limit(10),
        // TODO: companyHistory table not implemented yet
        // ctx.db
        //   .select()
        //   .from(companyHistory)
        //   .where(eq(companyHistory.companyId, company[0].id))
        //   .orderBy(desc(companyHistory.changedAt))
        //   .limit(20),
        ctx.db
          .select()
          .from(financialData)
          .where(eq(financialData.companyId, company[0].id))
          .orderBy(desc(financialData.year)),
        ctx.db
          .select()
          .from(fiscalStatus)
          .where(eq(fiscalStatus.companyId, company[0].id))
          .orderBy(desc(fiscalStatus.fetchedAt))
          .limit(1),
        ctx.db
          .select()
          .from(sourceProvenance)
          .where(eq(sourceProvenance.entityId, company[0].id)),
      ]);

      return {
        ...company[0],
        shareholders: companyShareholders,
        legalCases: companyLegalCases,
        // history: companyHistoryData, // TODO: companyHistory table not implemented yet
        financials: companyFinancials,
        fiscal: companyFiscal[0] || null,
        _sources: companySources,
      };
    }),

  // Obține companie după ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.id, input.id))
        .limit(1);

      if (!company[0]) {
        throw new Error('Company not found');
      }

      const [
        companyShareholders,
        companyLegalCases,
        // companyHistoryData, // TODO: companyHistory table not implemented yet
        companyFinancials,
        companyFiscal,
        companySources
      ] = await Promise.all([
        ctx.db.select().from(shareholders).where(eq(shareholders.companyId, company[0].id)),
        ctx.db
          .select()
          .from(legalCases)
          .where(eq(legalCases.companyId, company[0].id))
          .orderBy(desc(legalCases.startDate))
          .limit(10),
        // TODO: companyHistory table not implemented yet
        // ctx.db
        //   .select()
        //   .from(companyHistory)
        //   .where(eq(companyHistory.companyId, company[0].id))
        //   .orderBy(desc(companyHistory.changedAt))
        //   .limit(20),
        ctx.db
          .select()
          .from(financialData)
          .where(eq(financialData.companyId, company[0].id))
          .orderBy(desc(financialData.year)),
        ctx.db
          .select()
          .from(fiscalStatus)
          .where(eq(fiscalStatus.companyId, company[0].id))
          .orderBy(desc(fiscalStatus.fetchedAt))
          .limit(1),
        ctx.db
          .select()
          .from(sourceProvenance)
          .where(eq(sourceProvenance.entityId, company[0].id)),
      ]);

      return {
        ...company[0],
        shareholders: companyShareholders,
        legalCases: companyLegalCases,
        // history: companyHistoryData, // TODO: companyHistory table not implemented yet
        financials: companyFinancials,
        fiscal: companyFiscal[0] || null,
        _sources: companySources,
      };
    }),

  // Căutare avansată cu filtre
  searchAdvanced: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        city: z.string().optional(),
        county: z.string().optional(),
        status: z.string().optional(),
        legalForm: z.string().optional(),
        minTurnover: z.number().optional(),
        maxTurnover: z.number().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.query) {
        conditions.push(
          or(
            ilike(companies.cif, `%${input.query}%`),
            ilike(companies.name, `%${input.query}%`)
          )
        );
      }

      if (input.city) {
        conditions.push(ilike(companies.city, `%${input.city}%`));
      }

      if (input.county) {
        conditions.push(ilike(companies.county, `%${input.county}%`));
      }

      if (input.status) {
        conditions.push(eq(companies.status, input.status));
      }

      if (input.legalForm) {
        conditions.push(eq(companies.legalForm, input.legalForm));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await ctx.db
        .select()
        .from(companies)
        .where(whereClause)
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(companies.lastUpdated));

      return {
        companies: results,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  // Obține informații despre sursa datelor pentru o companie
  getSourceInfo: publicProcedure
    .input(z.object({ cif: z.string().min(1).max(20) }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.cif, input.cif))
        .limit(1);

      if (!company[0]) {
        throw new Error('Company not found');
      }

      const sources = await ctx.db
        .select()
        .from(sourceProvenance)
        .where(eq(sourceProvenance.entityId, company[0].id));

      // Group by field name
      const sourcesByField: Record<string, typeof sources> = {};
      sources.forEach((source: any) => {
        if (!sourcesByField[source.fieldName || 'unknown']) {
          sourcesByField[source.fieldName || 'unknown'] = [];
        }
        sourcesByField[source.fieldName || 'unknown'].push(source);
      });

      return {
        companyName: company[0].name,
        cif: company[0].cif,
        sources: sourcesByField,
        lastUpdated: company[0].lastUpdated,
        dataSourcesCount: new Set(sources.map((s: any) => s.sourceName)).size,
      };
    }),
});

