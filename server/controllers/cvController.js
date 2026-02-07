import {
  getOrCreateCompany,
  getLatestCVSubmission,
  createCVSubmission,
  getAllCompaniesWithSubmissions,
  deleteCompanyById,
  seedCompanies,
} from '../models/companyModel.js';
import {
  canSubmitCV,
  daysUntilNextSubmission,
  getNextSubmissionDate,
} from '../utils/dateHelpers.js';

const COOLDOWN_DAYS = 60;

/**
 * Check if a CV can be generated for a company
 * POST /api/cv/check
 * Body: { domain?, linkedinUrl?, cvType: 'english' | 'german', companyName? }
 */
export const checkCVEligibility = async (req, res) => {
  try {
    const { domain, linkedinUrl, cvType, companyName } = req.body;

    // Validation
    if (!domain && !linkedinUrl) {
      return res.status(400).json({
        error: 'Either domain or linkedinUrl must be provided',
      });
    }

    if (!cvType || !['english', 'german'].includes(cvType)) {
      return res.status(400).json({
        error: 'cvType must be either "english" or "german"',
      });
    }

    // Get or create company
    const company = await getOrCreateCompany(domain, linkedinUrl, companyName);

    // Get latest submission for this CV type
    const latestSubmission = await getLatestCVSubmission(company.id, cvType);

    // Check if CV can be submitted
    const canSubmit = canSubmitCV(
      latestSubmission?.submitted_at,
      COOLDOWN_DAYS
    );

    const response = {
      canGenerateCV: canSubmit,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        linkedinUrl: company.linkedin_url,
      },
      cvType,
    };

    if (latestSubmission) {
      response.lastSubmission = {
        id: latestSubmission.id,
        submittedAt: latestSubmission.submitted_at,
        jobTitle: latestSubmission.job_title,
      };
      response.daysRemaining = daysUntilNextSubmission(
        latestSubmission.submitted_at,
        COOLDOWN_DAYS
      );
      response.nextAvailableDate = getNextSubmissionDate(
        latestSubmission.submitted_at,
        COOLDOWN_DAYS
      );
    } else {
      response.daysRemaining = 0;
      response.message = 'No previous submission found. CV can be generated.';
    }

    return res.json(response);
  } catch (error) {
    console.error('Error checking CV eligibility:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Save a CV submission record
 * POST /api/cv/submit
 * Body: { domain?, linkedinUrl?, cvType: 'english' | 'german', companyName?, jobTitle? }
 */
export const saveCVSubmission = async (req, res) => {
  try {
    const { domain, linkedinUrl, cvType, companyName, jobTitle } = req.body;

    // Validation
    if (!domain && !linkedinUrl) {
      return res.status(400).json({
        error: 'Either domain or linkedinUrl must be provided',
      });
    }

    if (!cvType || !['english', 'german'].includes(cvType)) {
      return res.status(400).json({
        error: 'cvType must be either "english" or "german"',
      });
    }

    // Get or create company
    const company = await getOrCreateCompany(domain, linkedinUrl, companyName);

    // Check if CV can be submitted (optional check, you can remove if you want to force save)
    const latestSubmission = await getLatestCVSubmission(company.id, cvType);
    const canSubmit = canSubmitCV(
      latestSubmission?.submitted_at,
      COOLDOWN_DAYS
    );

    if (!canSubmit) {
      const daysRemaining = daysUntilNextSubmission(
        latestSubmission.submitted_at,
        COOLDOWN_DAYS
      );
      return res.status(400).json({
        error: 'CV cannot be submitted yet',
        daysRemaining,
        nextAvailableDate: getNextSubmissionDate(
          latestSubmission.submitted_at,
          COOLDOWN_DAYS
        ),
        lastSubmission: {
          submittedAt: latestSubmission.submitted_at,
          jobTitle: latestSubmission.job_title,
        },
      });
    }

    // Create submission record
    const submission = await createCVSubmission({
      company_id: company.id,
      cv_type: cvType,
      job_title: jobTitle || null,
      submitted_at: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'CV submission recorded successfully',
      submission: {
        id: submission.id,
        companyId: submission.company_id,
        cvType: submission.cv_type,
        submittedAt: submission.submitted_at,
        jobTitle: submission.job_title,
      },
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        linkedinUrl: company.linkedin_url,
      },
    });
  } catch (error) {
    console.error('Error saving CV submission:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Get all companies and their submission history
 * GET /api/companies
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await getAllCompaniesWithSubmissions();

    // Enhance the data with calculated fields
    const enhancedCompanies = companies.map((company) => {
      const submissions = company.cv_submissions || [];

      // Find latest submission for each type
      const englishSubmissions = submissions
        .filter((s) => s.cv_type === 'english')
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

      const germanSubmissions = submissions
        .filter((s) => s.cv_type === 'german')
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

      const latestEnglish = englishSubmissions[0] || null;
      const latestGerman = germanSubmissions[0] || null;

      return {
        id: company.id,
        name: company.name,
        domain: company.domain,
        linkedinUrl: company.linkedin_url,
        createdAt: company.created_at,
        english: latestEnglish
          ? {
              lastSubmittedAt: latestEnglish.submitted_at,
              jobTitle: latestEnglish.job_title,
              daysRemaining: daysUntilNextSubmission(
                latestEnglish.submitted_at,
                COOLDOWN_DAYS
              ),
              canSubmit: canSubmitCV(latestEnglish.submitted_at, COOLDOWN_DAYS),
              nextAvailableDate: getNextSubmissionDate(
                latestEnglish.submitted_at,
                COOLDOWN_DAYS
              ),
            }
          : {
              lastSubmittedAt: null,
              daysRemaining: 0,
              canSubmit: true,
              nextAvailableDate: new Date(),
            },
        german: latestGerman
          ? {
              lastSubmittedAt: latestGerman.submitted_at,
              jobTitle: latestGerman.job_title,
              daysRemaining: daysUntilNextSubmission(
                latestGerman.submitted_at,
                COOLDOWN_DAYS
              ),
              canSubmit: canSubmitCV(latestGerman.submitted_at, COOLDOWN_DAYS),
              nextAvailableDate: getNextSubmissionDate(
                latestGerman.submitted_at,
                COOLDOWN_DAYS
              ),
            }
          : {
              lastSubmittedAt: null,
              daysRemaining: 0,
              canSubmit: true,
              nextAvailableDate: new Date(),
            },
        totalSubmissions: submissions.length,
      };
    });

    return res.json({
      success: true,
      count: enhancedCompanies.length,
      companies: enhancedCompanies,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Delete a company and all its submissions
 * DELETE /api/cv/companies/:id
 */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const deleted = await deleteCompanyById(id);

    return res.json({
      success: true,
      message: 'Company and all submissions deleted',
      company: deleted,
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Seed initial companies with submission history
 * POST /api/cv/seed
 * Body: { companies: [{ name?, domain?, linkedin_url?, english_submitted_at?, german_submitted_at?, english_job_title?, german_job_title? }] }
 */
export const seedInitialCompanies = async (req, res) => {
  try {
    const { companies } = req.body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        error: 'companies array is required and must not be empty',
      });
    }

    // Validate each entry has at least domain or linkedin_url
    for (const entry of companies) {
      if (!entry.domain && !entry.linkedin_url) {
        return res.status(400).json({
          error: `Each company must have at least a domain or linkedin_url. Invalid entry: ${JSON.stringify(entry)}`,
        });
      }
    }

    const results = await seedCompanies(companies);

    const created = results.filter((r) => r.status === 'created').length;
    const existing = results.filter((r) => r.status === 'existing').length;
    const totalSubmissions = results.reduce((sum, r) => sum + r.submissions.length, 0);

    return res.status(201).json({
      success: true,
      message: `Seeded ${created} new companies (${existing} already existed), ${totalSubmissions} submission records created`,
      created,
      existing,
      totalSubmissions,
      companies: results,
    });
  } catch (error) {
    console.error('Error seeding companies:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
