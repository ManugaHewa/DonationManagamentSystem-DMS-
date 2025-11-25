import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCreateDonation } from '@/features/donations/hooks/useDonations';
import { apiClient } from '@/lib/api-client';
import type { CreateDonationRequest } from '@dms/types';

interface ExtendedCreateDonationRequest extends CreateDonationRequest {
  otherCause?: string;
}

export default function DonateFormPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExtendedCreateDonationRequest>({
    defaultValues: {
      currency: 'CAD',
    },
  });
  const createDonation = useCreateDonation();
  const [showOther, setShowOther] = useState(false);

  // Fetch donation causes
  const { data: causes } = useQuery({
    queryKey: ['donation-causes'],
    queryFn: async () => {
      const response = await apiClient.get('/donation-causes');
      return response.data.data;
    },
  });

  const amount = watch('amount');
  const processorFees = watch('processorFees');

  const onSubmit = (data: ExtendedCreateDonationRequest) => {
    const processorFees = Number.isFinite(data.processorFees)
      ? data.processorFees
      : undefined;

    const payload: ExtendedCreateDonationRequest = {
      ...data,
      currency: data.currency || 'CAD',
      processorFees,
      causeId: showOther && data.otherCause ? data.otherCause : data.causeId,
    };

    createDonation.mutate(payload, {
      onSuccess: () => {
        navigate('/donor/donations');
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Make a Donation</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {/* Donation Cause */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Donation Purpose *
          </label>
          <select
            {...register('causeId', { required: 'Please select a donation purpose' })}
            className="input"
            onChange={(e) => {
              const value = e.target.value;
              setShowOther(value === 'other');
            }}
          >
            <option value="">Select purpose</option>
            {/* Predefined causes */}
            <option value="general">General Donation - Support general operations</option>
            <option value="education">Education Fund - Support education programs</option>
            <option value="building">Building Fund - Help build new facilities</option>
            <option value="healthcare">Healthcare Fund - Medical assistance programs</option>
            <option value="community">Community Outreach - Local community support</option>
            {/* Dynamically loaded causes */}
            {causes?.map((cause: any) => (
              <option key={cause.id} value={cause.id}>
                {cause.name} {cause.description && `- ${cause.description}`}
              </option>
            ))}
            {/* Other option */}
            <option value="other">Other (please specify below)</option>
          </select>
          {errors.causeId && (
            <p className="mt-1 text-sm text-red-600">{errors.causeId.message}</p>
          )}
        </div>

        {/* Show other cause input when "Other" is selected */}
        {showOther && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specify Other Purpose *
            </label>
            <input
              type="text"
              {...register('otherCause', {
                required: showOther ? 'Please specify your donation purpose' : false,
                maxLength: { value: 100, message: 'Max length is 100 characters' },
              })}
              className="input"
              placeholder="Enter your donation purpose"
            />
            {errors.otherCause && (
              <p className="mt-1 text-sm text-red-600">{errors.otherCause.message}</p>
            )}
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method *
          </label>
          <select
            {...register('type', { required: 'Please select payment method' })}
            className="input"
          >
            <option value="">Select method</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="INTERAC">Interac e-Transfer</option>
            <option value="EFT">EFT/Bank Transfer</option>
            <option value="CANADA_HELPS">CanadaHelps</option>
            <option value="IN_KIND">In-Kind Donation</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (CAD) *
          </label>
          <input
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 1, message: 'Amount must be at least $1' },
              valueAsNumber: true,
            })}
            type="number"
            step="0.01"
            className="input"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Processor Fees (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Fees (if any)
          </label>
          <input
            {...register('processorFees', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="input"
            placeholder="0.00"
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional: Any processing fees deducted by payment processor
          </p>
        </div>

        {/* Net Amount Display */}
        {(() => {
          const net = Number(amount ?? 0) - Number(processorFees ?? 0);
          const hasValue = amount !== undefined || processorFees !== undefined;
          return hasValue && Number.isFinite(net) ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Net Amount to Temple: ${net.toFixed(2)} CAD
              </p>
            </div>
          ) : null;
        })()}

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            {...register('donorRemarks')}
            rows={3}
            className="input"
            placeholder="Any special notes or dedication..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/donor/dashboard')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createDonation.isPending}
            className="btn btn-primary flex-1"
          >
            {createDonation.isPending ? 'Submitting...' : 'Submit Donation'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Your donation will be marked as "Pending Validation" until verified by temple staff. You will receive an acknowledgment email once validated.
        </p>
      </div>
    </div>
  );
}
