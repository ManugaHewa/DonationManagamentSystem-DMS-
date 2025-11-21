import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useForm } from 'react-hook-form';

interface ReportFilters {
  startDate: string;
  endDate: string;
  reportType: string;
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters | null>(null);
  const { register, handleSubmit } = useForm<ReportFilters>();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', filters],
    queryFn: async () => {
      if (!filters) return null;
      const response = await apiClient.get('/reports/donations', {
        params: filters,
      });
      return response.data.data;
    },
    enabled: !!filters,
  });

  const onSubmit = (data: ReportFilters) => {
    setFilters(data);
  };

  const exportReport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await apiClient.get(`/reports/export/${format}`, {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>
      
      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Report</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <select
                {...register('reportType')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="donations">Donations</option>
                <option value="donors">Donors</option>
                <option value="financial">Financial Summary</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                {...register('startDate')}
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                {...register('endDate')}
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {isLoading && <div className="text-center py-12">Loading report...</div>}

      {reportData && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Report Results</h2>
            <div className="space-x-2">
              <button
                onClick={() => exportReport('csv')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Export Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Export PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <p className="text-sm text-gray-500">Report data will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
}
