'use client';

import { useState } from 'react';

export default function CompanyCard({ company, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (daysRemaining, canSubmit) => {
    if (canSubmit) return 'bg-green-100 text-green-800';
    if (daysRemaining > 30) return 'bg-red-100 text-red-800';
    if (daysRemaining > 14) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(company.id);
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const CVStatusBadge = ({ cvData, type }) => {
    const statusColor = getStatusColor(cvData.daysRemaining, cvData.canSubmit);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {type === 'english' ? 'English' : 'German'}
          </h4>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
            {cvData.canSubmit ? 'Available' : `${cvData.daysRemaining}d left`}
          </span>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>
            <span className="font-medium">Last Submitted:</span>{' '}
            {formatDate(cvData.lastSubmittedAt)}
          </p>
          {cvData.jobTitle && (
            <p>
              <span className="font-medium">Job:</span> {cvData.jobTitle}
            </p>
          )}
          {!cvData.canSubmit && (
            <p>
              <span className="font-medium">Next Available:</span>{' '}
              {formatDate(cvData.nextAvailableDate)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-700 mb-4">
              Delete <span className="font-bold">{company.name}</span> and all its submission records?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Header */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{company.name}</h3>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-gray-400 hover:text-red-600 transition-colors p-1"
            title="Delete company"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          {company.domain && (
            <p>
              <span className="font-medium">Domain:</span>{' '}
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {company.domain}
              </a>
            </p>
          )}
          {company.linkedinUrl && (
            <p>
              <span className="font-medium">LinkedIn:</span>{' '}
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Profile
              </a>
            </p>
          )}
          <p>
            <span className="font-medium">Total Submissions:</span> {company.totalSubmissions}
          </p>
        </div>
      </div>

      {/* CV Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CVStatusBadge cvData={company.english} type="english" />
        <CVStatusBadge cvData={company.german} type="german" />
      </div>
    </div>
  );
}
