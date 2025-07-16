import { pgTable, uuid, varchar, integer, timestamp, index, boolean, jsonb } from 'drizzle-orm/pg-core';



// Respondents table - basic info about who submitted the form
export const respondents = pgTable(
  'respondents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    companyName: varchar('company_name', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIndex: index('email_idx').on(table.email),
    };
  }
);

// Form submissions table - using JSONB to store all responses
export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    respondentId: uuid('respondent_id')
      .references(() => respondents.id)
      .notNull(),
    formType: varchar('form_type', { length: 50 }).notNull(), // e.g., 'financial-assessment', 'risk-analysis'
    responses: jsonb('responses').notNull(), // Store all question responses as JSONB
    isComplete: boolean('is_complete').default(true).notNull(),
    submissionDate: timestamp('submission_date', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      respondentIdIndex: index('respondent_id_idx').on(table.respondentId),
      submissionDateIndex: index('submission_date_idx').on(table.submissionDate),
    };
  }
);

// Financial insights generated from form submissions
export const financialInsights = pgTable(
  'financial_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id')
      .references(() => formSubmissions.id)
      .notNull(),
    respondentId: uuid('respondent_id')
      .references(() => respondents.id)
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: varchar('content', { length: 5000 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    priority: integer('priority').notNull(), // 1 = highest, 5 = lowest
    data: jsonb('data'), // Any additional structured data for the insight
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      submissionIdIndex: index('submission_id_idx').on(table.submissionId),
      respondentIdIndex: index('respondent_id_insights_idx').on(table.respondentId),
      categoryIndex: index('category_idx').on(table.category),
      priorityIndex: index('priority_idx').on(table.priority),
    };
  }
);

// Admin dashboard statistics (pre-computed for performance)
export const dashboardStats = pgTable(
  'dashboard_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stat_date: timestamp('stat_date', { withTimezone: true }).defaultNow().notNull(),
    total_submissions: integer('total_submissions').notNull(),
    submissions_today: integer('submissions_today').notNull(),
    total_insights: integer('total_insights').notNull(),
    insights_by_category: jsonb('insights_by_category').notNull(),
    recent_submissions: jsonb('recent_submissions').notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      dateIndex: index('date_idx').on(table.stat_date),
    };
  }
);

// Reviews table - to store user feedback/reviews
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    respondentId: uuid('respondent_id')
      .references(() => respondents.id)
      .notNull(),
    rating: integer('rating').notNull(), // Star rating (1-5)
    reaction: varchar('reaction', { length: 50 }), // Quick reaction type (e.g., "Great", "Loved it")
    feedback: varchar('feedback', { length: 2000 }), // Optional detailed feedback
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      respondentIdIndex: index('review_respondent_id_idx').on(table.respondentId),
      ratingIndex: index('rating_idx').on(table.rating),
    };
  }
);

// Type exports
export type Respondent = typeof respondents.$inferSelect;
export type NewRespondent = typeof respondents.$inferInsert;

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;

export type FinancialInsight = typeof financialInsights.$inferSelect;
export type NewFinancialInsight = typeof financialInsights.$inferInsert;

export type DashboardStat = typeof dashboardStats.$inferSelect;
export type NewDashboardStat = typeof dashboardStats.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
