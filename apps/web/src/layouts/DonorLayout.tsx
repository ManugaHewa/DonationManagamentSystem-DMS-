import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.stores';

export default function DonorLayout() {
  const location = useLocation();
  const { user } = useAuthStore();
  const logout = useLogout();

  const navigation = [
    { name: 'Dashboard', href: '/donor/dashboard' },
    { name: 'My Donations', href: '/donor/donations' },
    { name: 'Make Donation', href: '/donor/donate' },
    { name: 'Family Members', href: '/donor/family' },
    { name: 'Aloka Puja', href: '/donor/aloka-puja' },
    { name: 'Profile', href: '/donor/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">DMS - Donor Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="btn btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 flex-shrink-0">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
