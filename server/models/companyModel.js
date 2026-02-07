import { supabase } from '../config/database.js';

/**
 * Find a company by domain or LinkedIn URL
 */
export const findCompany = async (domain, linkedinUrl) => {
  let query = supabase
    .from('companies')
    .select('*');

  // Build OR condition for domain or linkedin_url
  const conditions = [];
  if (domain) conditions.push(`domain.eq.${domain}`);
  if (linkedinUrl) conditions.push(`linkedin_url.eq.${linkedinUrl}`);

  if (conditions.length === 0) {
    throw new Error('Either domain or linkedinUrl must be provided');
  }

  query = query.or(conditions.join(','));

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }

  return data;
};

/**
 * Create a new company record
 */
export const createCompany = async (companyData) => {
  const { data, error } = await supabase
    .from('companies')
    .insert([companyData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get or create a company
 */
export const getOrCreateCompany = async (domain, linkedinUrl, companyName = null) => {
  // Try to find existing company
  let company = await findCompany(domain, linkedinUrl);

  // If not found, create new company
  if (!company) {
    const newCompany = {
      domain: domain || null,
      linkedin_url: linkedinUrl || null,
      name: companyName || domain || linkedinUrl,
    };
    company = await createCompany(newCompany);
  }

  return company;
};

/**
 * Get the latest CV submission for a company by type (english or german)
 */
export const getLatestCVSubmission = async (companyId, cvType) => {
  const { data, error } = await supabase
    .from('cv_submissions')
    .select('*')
    .eq('company_id', companyId)
    .eq('cv_type', cvType)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

/**
 * Create a new CV submission record
 */
export const createCVSubmission = async (submissionData) => {
  const { data, error } = await supabase
    .from('cv_submissions')
    .insert([submissionData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a company and its submissions
 */
export const deleteCompanyById = async (companyId) => {
  // Fetch the company first so we can return it
  const { data: company, error: findError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (findError) throw findError;

  // Delete submissions first (foreign key constraint)
  const { error: subError } = await supabase
    .from('cv_submissions')
    .delete()
    .eq('company_id', companyId);

  if (subError) throw subError;

  // Delete the company
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
  return company;
};

/**
 * Seed companies in bulk (upsert by domain)
 */
export const seedCompanies = async (companiesList) => {
  const results = [];
  for (const company of companiesList) {
    const existing = await findCompany(company.domain, company.linkedin_url);
    if (existing) {
      results.push({ ...existing, status: 'existing' });
    } else {
      const created = await createCompany(company);
      results.push({ ...created, status: 'created' });
    }
  }
  return results;
};

/**
 * Get all companies with their latest submissions
 */
export const getAllCompaniesWithSubmissions = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      cv_submissions (
        id,
        cv_type,
        submitted_at,
        job_title
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
