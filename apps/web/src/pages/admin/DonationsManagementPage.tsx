import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DonationsManagementPage() {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, File | null>>({});

  const { data: donations, isLoading } = useQuery({
    queryKey: ['all-donations'],
    queryFn: async () => {
      const response = await apiClient.get('/donations');
      return response.data.data || [];
    },
  });

  const validateMutation = useMutation({
    mutationFn: async ({ donationId, approve }: { donationId: string; approve: boolean }) => {
      const formData = new FormData();
      formData.append('approved', String(approve));
      const note = remarks[donationId];
      if (note) formData.append('remarks', note);
      const file = attachments[donationId];
      if (file) formData.append('attachment', file);

      const response = await apiClient.patch(`/donations/${donationId}/validate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Donation updated');
      queryClient.invalidateQueries({ queryKey: ['all-donations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update donation');
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        ${parseFloat(donation.amount).toFixed(2)}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          donation.status === 'VALIDATED'
                            ? 'bg-green-100 text-green-800'
                            : donation.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.status === 'VALIDATED' ? 'Validated' : donation.status === 'CANCELLED' ? 'Rejected' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {donation.donor?.firstName} {donation.donor?.lastName}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {donation.type} - {donation.cause?.name || donation.causeId}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>{format(new Date(donation.dateRecorded), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    {(donation.donorRemarks || donation.templeRemarks) && (
                      <p className="mt-2 text-sm text-gray-500">{donation.donorRemarks || donation.templeRemarks}</p>
                    )}
                    {donation.templeRemarks?.includes('Proof:') && (
                      <div className="mt-2 text-sm space-y-1">
                        {donation.templeRemarks.split('\n').map((line: string, idx: number) => {
                          if (!line.includes('Proof:')) {
                            return (
                              <div key={idx} className="text-gray-600">
                                {line}
                              </div>
                            );
                          }
                          const rawUrl = line.replace('Proof: ', '').trim();
                          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                          const url =
                            rawUrl.startsWith('http') || rawUrl.startsWith('//')
                              ? rawUrl
                              : `${apiBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
                          const openProof = () => {
                            window.open(url, '_blank', 'noopener,noreferrer,width=900,height=700');
                          };
                          return (
                            <div key={idx}>
                              <button
                                type="button"
                                onClick={openProof}
                                className="text-indigo-600 hover:text-indigo-800 underline text-left"
                              >
                                View attachment
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {donation.status !== 'VALIDATED' && (
                    <div className="flex flex-col gap-2 items-end">
                      <textarea
                        className="w-64 border rounded px-2 py-1 text-sm"
                        placeholder="Remarks (optional)"
                        value={remarks[donation.id] || ''}
                        onChange={(e) => setRemarks((prev) => ({ ...prev, [donation.id]: e.target.value }))}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        className="text-sm"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAttachments((prev) => ({ ...prev, [donation.id]: file }));
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => validateMutation.mutate({ donationId: donation.id, approve: true })}
                          disabled={validateMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {validateMutation.isPending ? 'Saving...' : 'Validate with Proof'}
                        </button>
                        <button
                          onClick={() => validateMutation.mutate({ donationId: donation.id, approve: false })}
                          disabled={validateMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
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
