const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Check if a CV can be generated for a company
 */
export async function checkCVEligibility({ domain, linkedinUrl, cvType, companyName }) {
  const response = await fetch(`${API_BASE_URL}/api/cv/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain, linkedinUrl, cvType, companyName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check CV eligibility');
  }

  return response.json();
}

/**
 * Submit a CV record for a company
 */
export async function submitCV({ domain, linkedinUrl, cvType, companyName, jobTitle }) {
  const response = await fetch(`${API_BASE_URL}/api/cv/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain, linkedinUrl, cvType, companyName, jobTitle }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit CV');
  }

  return response.json();
}

/**
 * Get all companies and their submission history
 */
export async function getAllCompanies() {
  const response = await fetch(`${API_BASE_URL}/api/cv/companies`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch companies');
  }

  return response.json();
}

/**
 * Delete a company and all its submissions
 */
export async function deleteCompany(companyId) {
  const response = await fetch(`${API_BASE_URL}/api/cv/companies/${companyId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete company');
  }

  return response.json();
}

/**
 * Seed initial companies
 */
export async function seedCompanies(companies) {
  const response = await fetch(`${API_BASE_URL}/api/cv/seed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ companies }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to seed companies');
  }

  return response.json();
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const response = await fetch(`${API_BASE_URL}/api/queue/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch queue stats');
  }

  return response.json();
}
