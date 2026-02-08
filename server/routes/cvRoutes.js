import express from 'express';
import {
  checkCVEligibility,
  saveCVSubmission,
  checkAndSubmit,
  getAllCompanies,
  deleteCompany,
  seedInitialCompanies,
} from '../controllers/cvController.js';
import { queueMiddleware } from '../middleware/requestQueue.js';

const router = express.Router();

// Apply queue middleware to check and submit endpoints to prevent race conditions
router.post('/check', queueMiddleware(checkCVEligibility));
router.post('/submit', queueMiddleware(saveCVSubmission));
router.post('/check-and-submit', queueMiddleware(checkAndSubmit));

// Get all companies (no queue needed for read operations)
router.get('/companies', getAllCompanies);

// Delete a company and its submissions
router.delete('/companies/:id', deleteCompany);

// Seed initial companies
router.post('/seed', seedInitialCompanies);

export default router;
