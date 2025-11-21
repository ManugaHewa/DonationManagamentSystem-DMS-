import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';

export default function MyDonationsPage() {
  const { data: donations, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: async () => {
      const response = await apiClient.get('/donations/my-donations');
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Donations</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {donations?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No donations yet. Make your first donation!
            </li>
          ) : (
            donations?.map((donation: any) => (
              <li key={donation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        ${parseFloat(donation.amount).toFixed(2)}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          donation.status === 'VALIDATED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.status === 'VALIDATED' ? 'Validated' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {donation.type} {donation.cause?.name ? `- ${donation.cause.name}` : ''}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {format(new Date(donation.dateRecorded), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    {(donation.donorRemarks || donation.templeRemarks) && (
                      <p className="mt-2 text-sm text-gray-500">
                        {donation.donorRemarks || donation.templeRemarks}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
