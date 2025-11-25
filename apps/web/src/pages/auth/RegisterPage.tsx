import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

interface RegisterForm {
  email?: string;
  phone?: string;
  username?: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
  
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Registration submitted. Check your email to verify, then wait for admin approval.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });

  const onSubmit = (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!data.email && !data.phone && !data.username) {
      toast.error('Provide at least one: email, phone, or username');
      return;
    }

    registerMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-md shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="sr-only">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <input
              {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } })}
              type="email"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email (optional)"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}

            <input
              {...register('phone')}
              type="tel"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Phone number (optional)"
            />
            <input
              {...register('username')}
              type="text"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Username (optional)"
            />
          </div>

          <div>
            <label htmlFor="address" className="sr-only">Address</label>
            <input
              {...register('address', { required: 'Address is required' })}
              type="text"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Address"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="sr-only">City</label>
              <input
                {...register('city', { required: 'City is required' })}
                type="text"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="City"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label htmlFor="province" className="sr-only">Province</label>
              <input
                {...register('province', { required: 'Province is required' })}
                type="text"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Province"
              />
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>}
            </div>
            <div>
              <label htmlFor="postalCode" className="sr-only">Postal Code</label>
              <input
                {...register('postalCode', { required: 'Postal code is required' })}
                type="text"
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Postal Code"
              />
              {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              type="password"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
            <input
              {...register('confirmPassword', { required: 'Please confirm password' })}
              type="password"
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {registerMutation.isPending ? 'Registering...' : 'Register'}
          </button>
        </div>

        <div className="text-center">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
