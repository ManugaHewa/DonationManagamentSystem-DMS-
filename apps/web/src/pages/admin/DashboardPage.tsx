import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/dashboard');
      return response.data.data;
    },
  });

  const { data: recentDonations } = useQuery({
    queryKey: ['recent-donations'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/donations');
      return (response.data.data || []).slice(0, 5);
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Donors</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.totalDonors || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Donations</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.totalDonations || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${Number(stats?.totalAmount ?? 0).toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Donations</h2>
        {recentDonations?.length ? (
          <ul className="divide-y divide-gray-200">
            {recentDonations.map((donation: any) => (
              <li key={donation.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {donation.donor}
                  </p>
                  <p className="text-xs text-gray-500">
                    {donation.cause} • {donation.type} • {format(new Date(donation.dateRecorded), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {donation.currency} {Number(donation.amount).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No recent donations</p>
        )}
      </div>
    </div>
  );
}
