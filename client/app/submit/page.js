'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkCVEligibility, submitCV } from '@/lib/api';

export default function SubmitCV() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    domain: '',
    linkedinUrl: '',
    cvType: 'english',
    companyName: '',
    jobTitle: '',
  });

  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Only reset eligibility when company identification fields change
    if (['domain', 'linkedinUrl', 'cvType', 'companyName'].includes(name)) {
      setEligibilityResult(null);
    }
    setError(null);
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();

    if (!formData.domain && !formData.linkedinUrl) {
      setError('Please provide either a domain or LinkedIn URL');
      return;
    }

    setChecking(true);
    setError(null);
    setEligibilityResult(null);

    try {
      const result = await checkCVEligibility({
        domain: formData.domain || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        cvType: formData.cvType,
        companyName: formData.companyName || undefined,
      });

      setEligibilityResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setError(null);

    try {
      await submitCV({
        domain: formData.domain || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        cvType: formData.cvType,
        companyName: formData.companyName || undefined,
        jobTitle: formData.jobTitle || undefined,
      });

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Submitted Successfully!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Submission</h3>
            <div className="space-y-2 text-sm text-gray-700 mb-6">
              <p><span className="font-medium">Company:</span> {eligibilityResult?.company?.name || formData.companyName || formData.domain}</p>
              <p><span className="font-medium">CV Type:</span> {formData.cvType === 'english' ? 'English' : 'German'}</p>
              {formData.jobTitle && (
                <p><span className="font-medium">Job Title:</span> {formData.jobTitle}</p>
              )}
              <p className="text-gray-500 mt-3">This will record the submission date as today. Are you sure?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit CV</h1>
              <p className="mt-1 text-sm text-gray-600">
                Check eligibility and record a new CV submission
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <form onSubmit={handleCheckEligibility} className="space-y-6">
            {/* Company Identification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Domain
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    placeholder="example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Provide domain OR LinkedIn URL</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">Or provide LinkedIn profile</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* CV Type */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CV Type</h3>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cvType"
                    value="english"
                    checked={formData.cvType === 'english'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">English</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cvType"
                    value="german"
                    checked={formData.cvType === 'german'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">German</span>
                </label>
              </div>
            </div>

            {/* Check Eligibility Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={checking}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {checking ? 'Checking...' : 'Check Eligibility'}
              </button>
            </div>
          </form>

          {/* Eligibility Result */}
          {eligibilityResult && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              eligibilityResult.canGenerateCV
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-lg font-semibold ${
                  eligibilityResult.canGenerateCV ? 'text-green-900' : 'text-red-900'
                }`}>
                  {eligibilityResult.canGenerateCV ? '✅ Eligible' : '❌ Not Eligible'}
                </h4>
                {!eligibilityResult.canGenerateCV && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-200 text-red-800">
                    {eligibilityResult.daysRemaining} days remaining
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <p className={eligibilityResult.canGenerateCV ? 'text-green-800' : 'text-red-800'}>
                  <span className="font-medium">Company:</span> {eligibilityResult.company.name}
                </p>
                {eligibilityResult.company.domain && (
                  <p className={eligibilityResult.canGenerateCV ? 'text-green-800' : 'text-red-800'}>
                    <span className="font-medium">Domain:</span> {eligibilityResult.company.domain}
                  </p>
                )}
                {eligibilityResult.lastSubmission && (
                  <>
                    <p className={eligibilityResult.canGenerateCV ? 'text-green-800' : 'text-red-800'}>
                      <span className="font-medium">Last Submitted:</span>{' '}
                      {formatDate(eligibilityResult.lastSubmission.submittedAt)}
                    </p>
                    {eligibilityResult.lastSubmission.jobTitle && (
                      <p className={eligibilityResult.canGenerateCV ? 'text-green-800' : 'text-red-800'}>
                        <span className="font-medium">Previous Job:</span>{' '}
                        {eligibilityResult.lastSubmission.jobTitle}
                      </p>
                    )}
                    {!eligibilityResult.canGenerateCV && (
                      <p className="text-red-800">
                        <span className="font-medium">Next Available:</span>{' '}
                        {formatDate(eligibilityResult.nextAvailableDate)}
                      </p>
                    )}
                  </>
                )}
                {eligibilityResult.message && (
                  <p className="text-green-800 font-medium">{eligibilityResult.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Job Details Form (only show if eligible) */}
          {eligibilityResult?.canGenerateCV && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6 border-t border-gray-200 pt-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      placeholder="Senior Software Engineer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit CV Record'}
              </button>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
