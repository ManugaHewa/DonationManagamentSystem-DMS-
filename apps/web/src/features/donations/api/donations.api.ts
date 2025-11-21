import { apiClient } from '@/lib/api-client';
import type { CreateDonationRequest, DonationSummary, ApiResponse } from '@dms/types';

export const donationsApi = {
  getAll: async (params?: any): Promise<{ donations: DonationSummary[]; total: number }> => {
    const response = await apiClient.get('/donations', { params });
    return response.data.data;
  },

  getMyDonations: async (): Promise<DonationSummary[]> => {
    const response = await apiClient.get('/donations/my-donations');
    return response.data.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/donations/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDonationRequest): Promise<any> => {
    const response = await apiClient.post('/donations', data);
    return response.data.data;
  },

  validate: async (id: string, approved: boolean, remarks?: string): Promise<any> => {
    const response = await apiClient.patch(`/donations/${id}/validate`, {
      approved,
      remarks,
    });
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/donations/${id}`);
  },
};
