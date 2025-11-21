import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/users');
      return response.data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.patch(`/auth/users/${userId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User approved');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/auth/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('User removed');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users?.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">No users found</li>
          ) : (
            users?.map((user: any) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 gap-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'ACCOUNTANT' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'VOLUNTEER' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {user.emailVerified ? 'Email verified' : 'Email pending'}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Approved' : 'Pending approval'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {!user.isActive && (
                      <button
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    {!user.emailVerified && (
                      <button
                        onClick={() => {
                          if (window.confirm('Remove this unverified user?')) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center px-3 py-1 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? 'Removing...' : 'Remove'}
                      </button>
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
