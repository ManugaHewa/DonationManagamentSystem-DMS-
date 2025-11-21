import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { format } from 'date-fns';

export default function ReceiptsManagementPage() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const response = await apiClient.get('/receipts');
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tax Receipts</h1>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Generate Year-End Receipts
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {receipts?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No receipts generated yet</li>
          ) : (
            receipts?.map((receipt: any) => (
              <li key={receipt.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600">
                        Receipt #{receipt.receiptNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${parseFloat(receipt.amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {receipt.donor?.firstName} {receipt.donor?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Issued: {receipt.issueDate ? format(new Date(receipt.issueDate), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Fiscal Year: {receipt.fiscalYear}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <a
                      href={receipt.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Download
                    </a>
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
