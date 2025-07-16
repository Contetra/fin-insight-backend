import { Request, Response } from 'express';
import { sendCatchError, sendSuccess } from '../../utils/commonFunctions';

import { db } from '../../drizzle/db';
import { respondents, formSubmissions, financialInsights } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

// Interface for the raw database row returned from SQL query
interface InsightRow {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  insight_data: Record<string, unknown>;
  created_at: Date;
  fi_respondent_id: string;
  respondent_id: string;
  submission_id: string;
  form_type: string;
  responses: Record<string, unknown>;
  is_complete: boolean;
  submission_date: Date;
  submission_updated_at: Date;
  name: string;
  email: string;
  company_name: string | null;
  respondent_created_at: Date;
  reviews: Array<{
    id: string;
    rating: number;
    reaction: string | null;
    feedback: string | null;
    created_at: Date;
  }>;
}

// Submit a new form
export const submitForm = async (req: Request, res: Response) => {
  try {
    const { name, email, companyName, formType, responses } = req.body;
    
    // First create or find respondent
    let respondent = await db.select().from(respondents).where(eq(respondents.email, email)).limit(1).then(rows => rows[0]);
    
    if (!respondent) {
      const [newRespondent] = await db.insert(respondents).values({
        name,
        email,
        companyName
      }).returning();
      
      respondent = newRespondent;
    }
    
    // Create submission with JSONB responses
    const [submission] = await db.insert(formSubmissions).values({
      respondentId: respondent.id,
      formType,
      responses, // Store the entire responses object as JSONB
      isComplete: true
    }).returning();
    
    // Generate insights based on responses
    // Note: You'll need to implement the generateInsights function
    // For now, we'll just create a sample insight
    const generatedInsights = [
      {
        title: "Sample Financial Insight",
        content: "This is a sample financial insight based on the submitted form.",
        category: "Finance",
        priority: 1,
        data: { sample: "data" }
      }
    ];
    
    // Store insights
    if (generatedInsights && generatedInsights.length > 0) {
      await db.insert(financialInsights).values(
        generatedInsights.map(insight => ({
          submissionId: submission.id,
          respondentId: respondent.id,
          title: insight.title,
          content: insight.content,
          category: insight.category,
          priority: insight.priority,
          data: insight.data
        }))
      );
    }
    
    return sendSuccess(res, {
      message: 'Form submitted successfully',
      data: [{ 
        submissionId: submission.id, 
        respondentId: respondent.id,
        insights: generatedInsights 
      }],
      code: 201
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    return sendCatchError(res, { 
      message: 'Failed to submit form', 
      code: 500,
      errorDetail: error
    });
  }
};

// Get ALL insights with all related data including reviews (no filtering)
export const getInsights = async (req: Request, res: Response) => {
  try {
    // Get insights with form submission, respondent data, and reviews directly using SQL
    const results = await db.execute(sql`
      WITH insight_data AS (
        SELECT 
          fi.id,
          fi.title,
          fi.content,
          fi.category,
          fi.priority,
          fi.data as insight_data,
          fi.created_at as created_at,
          fi.respondent_id as fi_respondent_id,
          fs.id as submission_id,
          fs.form_type,
          fs.responses,
          fs.is_complete,
          fs.submission_date,
          fs.updated_at as submission_updated_at,
          r.id as respondent_id,
          r.name,
          r.email,
          r.company_name,
          r.created_at as respondent_created_at
        FROM financial_insights fi
        LEFT JOIN form_submissions fs ON fi.submission_id = fs.id
        LEFT JOIN respondents r ON fi.respondent_id = r.id
        ORDER BY r.created_at DESC, fi.priority DESC
      )
      SELECT 
        id.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', rev.id,
              'rating', rev.rating,
              'reaction', rev.reaction,
              'feedback', rev.feedback,
              'created_at', rev.created_at
            )
          ) FILTER (WHERE rev.id IS NOT NULL),
          '[]'
        ) as reviews
      FROM insight_data id
      LEFT JOIN reviews rev ON rev.respondent_id = id.respondent_id
      GROUP BY 
        id.id, id.title, id.content, id.category, id.priority, 
        id.insight_data, id.created_at, id.fi_respondent_id, id.respondent_id, id.submission_id,
        id.form_type, id.responses, id.is_complete, id.submission_date, 
        id.submission_updated_at, id.name, id.email, id.company_name,
        id.respondent_created_at
    `);
    
    // Format the results into a well-structured object
    const formattedResults = (results.rows as unknown as InsightRow[]).map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      priority: row.priority,
      insightData: row.insight_data,
      createdAt: row.created_at,
      financialInsightRespondentId: row.fi_respondent_id,
      submission: {
        id: row.submission_id,
        formType: row.form_type,
        responses: row.responses,
        isComplete: row.is_complete,
        submissionDate: row.submission_date,
        updatedAt: row.submission_updated_at
      },
      respondent: {
        id: row.respondent_id,
        name: row.name,
        email: row.email,
        companyName: row.company_name,
        createdAt: row.respondent_created_at
      },
      reviews: row.reviews
    }));
    
    return sendSuccess(res, { 
      data: formattedResults, 
      message: 'All insights with complete data and reviews retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return sendCatchError(res, { 
      message: 'Failed to fetch insights', 
      code: 500,
      errorDetail: error 
    });
  }
};



