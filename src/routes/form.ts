import express from 'express';
import { submitForm, getInsights } from '../controller/form-management/form-management';
import { submitReview, getAllReviews, getRespondentReviews } from '../controller/form-management/review-management';

const route = express.Router();

// Form submission endpoints
route.post('/submissions', submitForm);
route.get('/insights', getInsights); // Gets ALL insights with all related data

// Review endpoints
route.post('/reviews', submitReview);
route.get('/reviews', getAllReviews);
route.get('/reviews/:respondentId', getRespondentReviews);

export default route;
