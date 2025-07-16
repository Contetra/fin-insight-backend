import { Request, Response } from 'express';
import { sendCatchError, sendSuccess } from '../../utils/commonFunctions';
import { db } from '../../drizzle/db';
import { reviews } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Submit a new review
 * Expected body: { respondentId, rating, reaction, feedback }
 */
export const submitReview = async (req: Request, res: Response) => {
  try {
    const { respondentId, rating, reaction, feedback } = req.body;
    
    if (!respondentId || !rating) {
      return sendCatchError(res, {
        message: 'Missing required fields: respondentId and rating',
        code: 400,
      });
    }
    
    // Validate rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      return sendCatchError(res, {
        message: 'Rating must be between 1 and 5',
        code: 400,
      });
    }
    
    // Check if respondent exists
    const respondent = await db.execute(
      sql`SELECT id FROM respondents WHERE id = ${respondentId} LIMIT 1`
    );
    
    if (respondent.rows.length === 0) {
      return sendCatchError(res, {
        message: 'Respondent not found',
        code: 404,
      });
    }
    
    // Insert the review
    const [newReview] = await db.insert(reviews).values({
      respondentId,
      rating,
      reaction: reaction || null,
      feedback: feedback || null,
    }).returning();
    
    return sendSuccess(res, {
      message: 'Review submitted successfully',
      data: [newReview], // Wrapping in array to match expected type
      code: 201,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return sendCatchError(res, {
      message: 'Failed to submit review',
      code: 500,
      errorDetail: error,
    });
  }
};

/**
 * Get all reviews
 */
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    // Get all reviews with related respondent data
    const results = await db.execute(sql`
      SELECT 
        r.id,
        r.rating,
        r.reaction,
        r.feedback,
        r.created_at,
        resp.id as respondent_id,
        resp.name,
        resp.email,
        resp.company_name
      FROM reviews r
      LEFT JOIN respondents resp ON r.respondent_id = resp.id
      ORDER BY r.created_at DESC
    `);
    
    // Format the response
    const formattedResults = results.rows.map(row => ({
      id: row.id,
      rating: row.rating,
      reaction: row.reaction,
      feedback: row.feedback,
      createdAt: row.created_at,
      respondent: {
        id: row.respondent_id,
        name: row.name,
        email: row.email,
        companyName: row.company_name,
      }
    }));
    
    return sendSuccess(res, {
      message: 'All reviews retrieved successfully',
      data: formattedResults, // This is already an array from the map function
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return sendCatchError(res, {
      message: 'Failed to fetch reviews',
      code: 500,
      errorDetail: error,
    });
  }
};

/**
 * Get reviews by respondent ID
 */
export const getRespondentReviews = async (req: Request, res: Response) => {
  try {
    const { respondentId } = req.params;
    
    if (!respondentId) {
      return sendCatchError(res, {
        message: 'Missing respondent ID',
        code: 400,
      });
    }
    
    // Check if respondent exists
    const respondent = await db.execute(
      sql`SELECT id FROM respondents WHERE id = ${respondentId} LIMIT 1`
    );
    
    if (respondent.rows.length === 0) {
      return sendCatchError(res, {
        message: 'Respondent not found',
        code: 404,
      });
    }
    
    // Query for reviews by this respondent
    const reviewData = await db.select().from(reviews).where(eq(reviews.respondentId, respondentId));
    
    return sendSuccess(res, {
      message: `Successfully retrieved reviews for respondent ${respondentId}`,
      data: reviewData, // This is already an array from the db.select()
    });
  } catch (error) {
    console.error('Error fetching respondent reviews:', error);
    return sendCatchError(res, {
      message: 'Failed to fetch respondent reviews',
      code: 500,
      errorDetail: error,
    });
  }
};
