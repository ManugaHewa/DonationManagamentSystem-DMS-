// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Donor types
export interface DonorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  preferredLanguage: string;
  familyId?: string;
  familyName?: string;
}

// Donation types
export interface CreateDonationRequest {
  donorId?: string;
  causeId: string;
  type: string;
  amount: number;
  currency: string;
  processorFees?: number;
  donorRemarks?: string;
  templeRemarks?: string;
  isAnonymous?: boolean;
}

export interface DonationSummary {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  cause: string;
  dateRecorded: string;
  receiptNumber?: string;
}

// Report types
export interface DonationReportFilters {
  startDate?: string;
  endDate?: string;
  donorId?: string;
  causeId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface DonationReportRow {
  date: string;
  donorName: string;
  cause: string;
  type: string;
  amount: number;
  status: string;
  receiptNumber?: string;
}

// Receipt types
export interface ReceiptGenerationRequest {
  donationIds: string[];
  type: 'ACKNOWLEDGMENT' | 'TAX_RECEIPT';
  format: 'EMAIL' | 'PDF';
}

// Aloka Puja types
export interface AlokaPujaRequest {
  pujaDate: string;
  pujaType: string;
  rememberedPersons: {
    firstName: string;
    lastName: string;
    personType: string;
    relationship?: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
  }[];
  notes?: string;
}

// Dashboard types
export interface DashboardStats {
  totalDonations: number;
  pendingValidation: number;
  totalAmount: number;
  donorsCount: number;
  recentDonations: DonationSummary[];
}
