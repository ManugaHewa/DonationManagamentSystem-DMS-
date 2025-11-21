import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';

type Status = 'idle' | 'success' | 'error' | 'loading';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = params.get('token');
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }
      try {
        setStatus('loading');
        const response = await apiClient.get('/auth/verify-email', { params: { token } });
        setStatus('success');
        setMessage(response.data?.message || 'Email verified. Pending admin approval.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed.');
      }
    };
    verify();
  }, [params]);

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Verify your email</h1>
      <p className="text-gray-600">
        {status === 'loading' ? 'Verifying your email...' : message || 'Processing...'}
      </p>
      {(status === 'success' || status === 'error') && (
        <div className="space-x-3">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Go to login
          </Link>
          <Link to="/register" className="text-gray-600 hover:text-gray-800 font-medium">
            Create a new account
          </Link>
        </div>
      )}
    </div>
  );
}
