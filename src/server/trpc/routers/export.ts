import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { companies } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Router pentru export date
 * 
 * Free tier: max 10 exporturi/zi
 * Pro tier: unlimited exports
 */

export const exportRouter = router({
  // Export companie ca JSON
  exportCompanyJson: publicProcedure
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

      return {
        success: true,
        data: company[0],
        format: 'json',
        exportedAt: new Date().toISOString(),
      };
    }),

  // Export companie ca CSV
  exportCompanyCSV: publicProcedure
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

      // Convert to CSV
      const csvHeaders = Object.keys(company[0]).join(',');
      const csvValues = Object.values(company[0])
        .map(v => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
          return v;
        })
        .join(',');

      const csv = `${csvHeaders}\n${csvValues}`;

      return {
        success: true,
        data: csv,
        format: 'csv',
        filename: `company_${input.cif}_${new Date().toISOString().split('T')[0]}.csv`,
        exportedAt: new Date().toISOString(),
      };
    }),

  // Batch export (multiple companies)
  exportBatch: publicProcedure
    .input(
      z.object({
        cifs: z.array(z.string()).max(100), // Max 100 companies per batch
        format: z.enum(['json', 'csv']),
      })
    )
    .query(async ({ ctx, input }) => {
      const batchCompanies = await Promise.all(
        input.cifs.map(cif =>
          ctx.db
            .select()
            .from(companies)
            .where(eq(companies.cif, cif))
            .limit(1)
        )
      );

      const results = batchCompanies.filter(c => c[0]).map(c => c[0]);

      if (input.format === 'json') {
        return {
          success: true,
          count: results.length,
          data: results,
          format: 'json',
          exportedAt: new Date().toISOString(),
        };
      } else {
        // CSV format
        const csvHeaders = results[0] ? Object.keys(results[0]).join(',') : '';
        const csvRows = results.map(company =>
          Object.values(company)
            .map(v => {
              if (v === null || v === undefined) return '';
              if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
              return v;
            })
            .join(',')
        );

        const csv = [csvHeaders, ...csvRows].join('\n');

        return {
          success: true,
          count: results.length,
          data: csv,
          format: 'csv',
          filename: `companies_export_${new Date().toISOString().split('T')[0]}.csv`,
          exportedAt: new Date().toISOString(),
        };
      }
    }),
});

