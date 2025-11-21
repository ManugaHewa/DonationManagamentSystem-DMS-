import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth?: string;
}

export default function FamilyManagementPage() {
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FamilyMember>();

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const response = await apiClient.get('/donors/me');
      return response.data.data?.familyMembers || [];
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: FamilyMember) => {
      const response = await apiClient.post('/donors/me/family', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Family member added');
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      reset();
      setIsAdding(false);
    },
    onError: () => {
      toast.error('Failed to add family member');
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/donors/family-members/${memberId}`);
    },
    onSuccess: () => {
      toast.success('Family member removed');
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
    onError: () => {
      toast.error('Failed to remove family member');
    },
  });

  const onSubmit = (data: FamilyMember) => {
    addMemberMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Family Member
        </button>
      </div>

      {isAdding && (
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Family Member</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <input
                {...register('relationship', { required: 'Relationship is required' })}
                type="text"
                placeholder="e.g., Spouse, Child, Parent"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.relationship && <p className="text-red-500 text-xs mt-1">{errors.relationship.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth (Optional)</label>
              <input
                {...register('dateOfBirth')}
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {familyMembers?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No family members added yet.
            </li>
          ) : (
            familyMembers?.map((member: FamilyMember) => (
              <li key={member.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{member.relationship}</p>
                    {member.dateOfBirth && (
                      <p className="text-sm text-gray-500">
                        DOB: {new Date(member.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteMemberMutation.mutate(member.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
