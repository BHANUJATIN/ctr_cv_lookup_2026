-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_domain UNIQUE (domain),
  CONSTRAINT unique_linkedin_url UNIQUE (linkedin_url),
  CONSTRAINT at_least_one_identifier CHECK (domain IS NOT NULL OR linkedin_url IS NOT NULL)
);

-- CV Submissions table
CREATE TABLE IF NOT EXISTS cv_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cv_type TEXT NOT NULL CHECK (cv_type IN ('english', 'german')),
  job_title TEXT,
  job_description TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_cv_type CHECK (cv_type IN ('english', 'german'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_linkedin_url ON companies(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_cv_submissions_company_id ON cv_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_submissions_cv_type ON cv_submissions(cv_type);
CREATE INDEX IF NOT EXISTS idx_cv_submissions_submitted_at ON cv_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_submissions_company_type ON cv_submissions(company_id, cv_type, submitted_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional, remove if not needed
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- WARNING: These policies allow unrestricted access. Modify for production use.
CREATE POLICY "Allow public read access on companies"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on companies"
  ON companies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on companies"
  ON companies FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on cv_submissions"
  ON cv_submissions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on cv_submissions"
  ON cv_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on cv_submissions"
  ON cv_submissions FOR UPDATE
  USING (true);

-- Insert some sample data (optional - for testing)
-- INSERT INTO companies (name, domain, linkedin_url) VALUES
-- ('Example Corp', 'example.com', 'https://linkedin.com/company/example-corp'),
-- ('Tech Solutions', 'techsolutions.com', NULL),
-- ('Global Industries', NULL, 'https://linkedin.com/company/global-industries');
