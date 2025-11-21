import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AlokaPujaForm {
  pujaDate: string;
  pujaType: string;
  notes?: string;
}

export default function AlokaPujaPage() {
  const [isScheduling, setIsScheduling] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlokaPujaForm>();

  const { data: pujas, isLoading } = useQuery({
    queryKey: ['my-pujas'],
    queryFn: async () => {
      const response = await apiClient.get('/aloka-puja/my-pujas');
      return response.data.data || [];
    },
  });

  const schedulePujaMutation = useMutation({
    mutationFn: async (data: AlokaPujaForm) => {
      const response = await apiClient.post('/aloka-puja', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Aloka Puja scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['my-pujas'] });
      reset();
      setIsScheduling(false);
    },
    onError: () => {
      toast.error('Failed to schedule Aloka Puja');
    },
  });

  const onSubmit = (data: AlokaPujaForm) => {
    schedulePujaMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Aloka Puja Schedule</h1>
        <button
          onClick={() => setIsScheduling(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Schedule New Puja
        </button>
      </div>

      {isScheduling && (
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule Aloka Puja</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Puja Date</label>
              <input
                {...register('pujaDate', { required: 'Date is required' })}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.pujaDate && <p className="text-red-500 text-xs mt-1">{errors.pujaDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Puja Type</label>
              <select
                {...register('pujaType', { required: 'Type is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select type</option>
                <option value="ALOKA">Aloka Puja</option>
                <option value="REMEMBRANCE">Remembrance Ceremony</option>
                <option value="BLESSING">Blessing Ceremony</option>
              </select>
              {errors.pujaType && <p className="text-red-500 text-xs mt-1">{errors.pujaType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Any special requests or information"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsScheduling(false);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={schedulePujaMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {schedulePujaMutation.isPending ? 'Scheduling...' : 'Schedule Puja'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {pujas?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No scheduled pujas yet.
            </li>
          ) : (
            pujas?.map((puja: any) => (
              <li key={puja.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{puja.pujaType}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(puja.pujaDate), 'MMMM dd, yyyy')}
                    </p>
                    {puja.notes && <p className="text-sm text-gray-500 mt-1">{puja.notes}</p>}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    new Date(puja.pujaDate) > new Date() 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {new Date(puja.pujaDate) > new Date() ? 'Upcoming' : 'Completed'}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
