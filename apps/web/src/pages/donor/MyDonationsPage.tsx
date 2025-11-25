import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MyDonationsPage() {
  const [receiptsReady, setReceiptsReady] = useState<boolean | null>(null);

  const { data: donations, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: async () => {
      const response = await apiClient.get('/donations/my-donations');
      return response.data.data || [];
    },
  });

  const checkReceipts = async () => {
    try {
      const response = await apiClient.get('/receipts/my-receipts');
      const list = response.data.data || [];
      const hasReceipts = list.length > 0;
      setReceiptsReady(hasReceipts);
      if (!hasReceipts) {
        toast('Receipts are not ready yet. Please check back later.', { icon: 'ℹ️' });
      } else {
        const first = list[0];
        try {
          // Hit the download endpoint to resolve the latest URL, then trigger a download/open
          const dl = await apiClient.get(`/receipts/${first.id}/download`);
          const url = dl.data?.data?.receiptUrl || first.receiptUrl;
          if (url) {
            toast.success('Receipts are ready. Downloading your latest receipt...');
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.download = url.split('/').pop() || 'receipt.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else {
            toast.error('Could not find the receipt file.');
          }
        } catch (err) {
          toast.error('Failed to download the receipt file.');
        }
      }
    } catch (error) {
      // Attempt self-generation if unlocked
      try {
        const currentYear = new Date().getFullYear();
        const gen = await apiClient.post(`/receipts/self/year/${currentYear}`);
        const fileUrl = gen.data?.data?.receiptUrl;
        if (fileUrl) {
          toast.success('Receipts are ready. Downloading your receipt...');
          const link = document.createElement('a');
          link.href = fileUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = fileUrl.split('/').pop() || 'receipt.pdf';
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          toast.error('Receipts are not ready yet.');
        }
      } catch (genError: any) {
        if (genError.response?.status === 403) {
          toast('Receipts are not unlocked yet. Please check back later.', { icon: 'ℹ️' });
        } else {
          toast.error('Unable to check receipts right now.');
        }
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Donations</h1>
      <div className="mb-4">
        <button onClick={checkReceipts} className="btn btn-primary">
          Download Tax Receipts
        </button>
        {receiptsReady === false && (
          <p className="mt-2 text-sm text-gray-600">Receipts are not ready yet.</p>
        )}
      </div>
      
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
