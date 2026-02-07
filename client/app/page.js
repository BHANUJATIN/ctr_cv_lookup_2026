'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCompanies, getQueueStats, deleteCompany } from '@/lib/api';
import CompanyCard from '@/components/CompanyCard';
import StatsCard from '@/components/StatsCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, unavailable

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [companiesResponse, queueResponse] = await Promise.all([
        getAllCompanies(),
        getQueueStats().catch(() => null),
      ]);

      setCompanies(companiesResponse.companies || []);
      setQueueStats(queueResponse?.queue || null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!companies.length) {
      return {
        total: 0,
        englishAvailable: 0,
        germanAvailable: 0,
        totalSubmissions: 0,
      };
    }

    return companies.reduce(
      (acc, company) => {
        acc.total += 1;
        acc.englishAvailable += company.english.canSubmit ? 1 : 0;
        acc.germanAvailable += company.german.canSubmit ? 1 : 0;
        acc.totalSubmissions += company.totalSubmissions;
        return acc;
      },
      { total: 0, englishAvailable: 0, germanAvailable: 0, totalSubmissions: 0 }
    );
  };

  const handleDeleteCompany = async (companyId) => {
    await deleteCompany(companyId);
    setCompanies(prev => prev.filter(c => c.id !== companyId));
  };

  const filteredCompanies = companies.filter((company) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'available') {
      matchesStatus = company.english.canSubmit || company.german.canSubmit;
    } else if (filterStatus === 'unavailable') {
      matchesStatus = !company.english.canSubmit && !company.german.canSubmit;
    }

    return matchesSearch && matchesStatus;
  });

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner message="Loading companies..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CV Submission Tracker</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track CV submissions with 60-day cooldown period
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/submit')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                + Submit CV
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Companies" value={stats.total} icon="🏢" color="blue" />
          <StatsCard
            title="English CVs Available"
            value={stats.englishAvailable}
            icon="🇬🇧"
            color="green"
          />
          <StatsCard
            title="German CVs Available"
            value={stats.germanAvailable}
            icon="🇩🇪"
            color="green"
          />
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon="📄"
            color="purple"
          />
        </div>

        {/* Queue Stats (if available) */}
        {queueStats && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-blue-900">Queue Status</h3>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-700">
                  <span className="font-semibold">Pending:</span> {queueStats.pending}
                </span>
                <span className="text-blue-700">
                  <span className="font-semibold">Size:</span> {queueStats.size}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by company name or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Companies</option>
                <option value="available">Available for CV</option>
                <option value="unavailable">Unavailable (Cooldown)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {companies.length === 0
                ? 'No companies found. Start by making your first API call!'
                : 'No companies match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} onDelete={handleDeleteCompany} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
