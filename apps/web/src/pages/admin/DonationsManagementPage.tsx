import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DonationsManagementPage() {
  const queryClient = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations'],
    queryFn: async () => {
      const response = await apiClient.get('/donations');
      return response.data.data || [];
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (donationId: string) => {
      const response = await apiClient.patch(`/donations/${donationId}/validate`, {
        isValidated: true,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Donation validated');
      queryClient.invalidateQueries({ queryKey: ['all-donations'] });
    },
    onError: () => {
      toast.error('Failed to validate donation');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Donations Management</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {donations?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No donations found</li>
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
                          donation.isValidated 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.isValidated ? 'Validated' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {donation.donor?.firstName} {donation.donor?.lastName}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {donation.donationType} - {donation.paymentMethod}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>{format(new Date(donation.dateRecorded), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    {donation.notes && (
                      <p className="mt-2 text-sm text-gray-500">{donation.notes}</p>
                    )}
                  </div>
                  {!donation.isValidated && (
                    <button
                      onClick={() => validateMutation.mutate(donation.id)}
                      disabled={validateMutation.isPending}
                      className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      Validate
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
