import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { donationsApi } from '../api/donations.api';
import toast from 'react-hot-toast';

export const useMyDonations = () => {
  return useQuery({
    queryKey: ['my-donations'],
    queryFn: donationsApi.getMyDonations,
  });
};

export const useAllDonations = (params?: any) => {
  return useQuery({
    queryKey: ['donations', params],
    queryFn: () => donationsApi.getAll(params),
  });
};

export const useDonation = (id: string) => {
  return useQuery({
    queryKey: ['donation', id],
    queryFn: () => donationsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: donationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      toast.success('Donation recorded successfully!');
    },
    onError: () => {
      toast.error('Failed to record donation');
    },
  });
};

export const useValidateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved, remarks }: { id: string; approved: boolean; remarks?: string }) =>
      donationsApi.validate(id, approved, remarks),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success(
        variables.approved ? 'Donation validated successfully!' : 'Donation rejected'
      );
    },
  });
};
