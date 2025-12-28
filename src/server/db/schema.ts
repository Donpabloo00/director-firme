import { pgTable, uuid, varchar, text, timestamp, integer, decimal, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabel principal: Companii
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  cif: varchar('cif', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 500 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 50 }),
  registrationDate: timestamp('registration_date'),
  status: varchar('status', { length: 50 }),
  legalForm: varchar('legal_form', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  mainActivity: text('main_activity'),
  capital: decimal('capital', { precision: 15, scale: 2 }),
  
  // SEO fields
  slug: varchar('slug', { length: 200 }), // SEO-friendly URL slug
  seoContent: text('seo_content'), // Conținut SEO generat programatic (150-300 cuvinte)
  
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  cifIdx: index('cif_idx').on(table.cif),
  nameIdx: index('name_idx').on(table.name),
  slugIdx: index('slug_idx').on(table.slug), // Index pentru slug-uri SEO
  statusIdx: index('status_idx').on(table.status), // Index pentru filtrare status
  countyIdx: index('county_idx').on(table.county), // Index pentru filtrare județ
}));

// Tabel: Date Financiare (istoric pe mai mulți ani)
export const financialData = pgTable('financial_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  turnover: decimal('turnover', { precision: 15, scale: 2 }),
  profit: decimal('profit', { precision: 15, scale: 2 }),
  employees: integer('employees'),
  assets: decimal('assets', { precision: 15, scale: 2 }),
  debts: decimal('debts', { precision: 15, scale: 2 }),
  source: varchar('source', { length: 100 }),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
}, (table) => ({
  compYearIdx: index('comp_year_idx').on(table.companyId, table.year),
}));

// Tabel: Status Fiscal (ANAF)
export const fiscalStatus = pgTable('fiscal_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  vatStatus: varchar('vat_status', { length: 50 }),
  inactiveStatus: varchar('inactive_status', { length: 50 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  source: varchar('source', { length: 100 }),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});

// Tabel: Proveniența Datelor (Source Attribution - Legal)
export const sourceProvenance = pgTable('source_provenance', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'company', 'financial', 'fiscal'
  entityId: uuid('entity_id').notNull(),
  fieldName: varchar('field_name', { length: 100 }),
  sourceName: varchar('source_name', { length: 100 }).notNull(),
  sourceUrl: text('source_url'),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  hashPayload: text('hash_payload'), // Pentru audit și deduplicare
});

// Tabel: Audit Logs (Cine a văzut ce - Legal GDPR)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // null pentru vizitatori anonimi
  action: varchar('action', { length: 100 }).notNull(), // 'view_company', 'search'
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  queryParams: jsonb('query_params'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
  ipIdx: index('audit_ip_idx').on(table.ipAddress),
}));

// Tabel pentru acționari/asociați (Rămâne din versiunea anterioară)
export const shareholders = pgTable('shareholders', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  type: varchar('type', { length: 50 }), 
  sharePercentage: decimal('share_percentage', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel pentru dosare judiciare (Rămâne din versiunea anterioară)
export const legalCases = pgTable('legal_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  caseNumber: varchar('case_number', { length: 100 }).notNull(),
  court: varchar('court', { length: 500 }),
  status: varchar('status', { length: 100 }),
  caseType: varchar('case_type', { length: 100 }),
  startDate: timestamp('start_date'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabel pentru companiile monitorizate de utilizatori
export const companyWatches = pgTable('company_watches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  watchFields: text('watch_fields').array(), // ['turnover', 'status', 'vat_status']
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastNotifiedAt: timestamp('last_notified_at'),
}, (table) => ({
  userCompanyIdx: index('user_company_watch_idx').on(table.userId, table.companyId),
}));

// Relatii
export const companiesRelations = relations(companies, ({ many }) => ({
  financials: many(financialData),
  fiscalStatuses: many(fiscalStatus),
  shareholders: many(shareholders),
  legalCases: many(legalCases),
}));

export const financialDataRelations = relations(financialData, ({ one }) => ({
  company: one(companies, { fields: [financialData.companyId], references: [companies.id] }),
}));

export const fiscalStatusRelations = relations(fiscalStatus, ({ one }) => ({
  company: one(companies, { fields: [fiscalStatus.companyId], references: [companies.id] }),
}));

export const shareholdersRelations = relations(shareholders, ({ one }) => ({
  company: one(companies, { fields: [shareholders.companyId], references: [companies.id] }),
}));

export const legalCasesRelations = relations(legalCases, ({ one }) => ({
  company: one(companies, { fields: [legalCases.companyId], references: [companies.id] }),
}));

export const companyWatchesRelations = relations(companyWatches, ({ one }) => ({
  company: one(companies, { fields: [companyWatches.companyId], references: [companies.id] }),
}));
