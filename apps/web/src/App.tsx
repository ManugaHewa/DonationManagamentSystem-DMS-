import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.stores';
import { useEffect, useState } from 'react';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DonorLayout from './layouts/DonorLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Donor Pages
import DonorDashboard from './pages/donor/DashboardPage';
import MyDonations from './pages/donor/MyDonationsPage';
import DonateForm from './pages/donor/DonateFormPage';
import FamilyManagement from './pages/donor/FamilyManagementPage';
import AlokaPujaPage from './pages/donor/AlokaPujaPage';
import ProfilePage from './pages/donor/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import DonorsManagement from './pages/admin/DonorsManagementPage';
import DonationsManagement from './pages/admin/DonationsManagementPage';
import ReceiptsManagement from './pages/admin/ReceiptsManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import UsersManagement from './pages/admin/UsersManagementPage';

function App() {
  const [hydrated, setHydrated] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  console.log('App rendered', { hydrated, isAuthenticated, user });

  useEffect(() => {
    console.log('Setting hydrated to true');
    setHydrated(true);
  }, []);

  if (!hydrated || (isAuthenticated && !user)) {
    return null;
  }

  console.log('Rendering routes');


  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Donor Routes */}
      {isAuthenticated && user?.role === 'DONOR' && (
        <Route element={<DonorLayout />}>
          <Route path="/donor/dashboard" element={<DonorDashboard />} />
          <Route path="/donor/donations" element={<MyDonations />} />
          <Route path="/donor/donate" element={<DonateForm />} />
          <Route path="/donor/family" element={<FamilyManagement />} />
          <Route path="/donor/aloka-puja" element={<AlokaPujaPage />} />
          <Route path="/donor/profile" element={<ProfilePage />} />
        </Route>
      )}

      {/* Admin/Accountant Routes */}
      {isAuthenticated && ['ADMIN', 'ACCOUNTANT', 'VOLUNTEER'].includes(user?.role || '') && (
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/donors" element={<DonorsManagement />} />
          <Route path="/admin/donations" element={<DonationsManagement />} />
          <Route path="/admin/receipts" element={<ReceiptsManagement />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          {user?.role === 'ADMIN' && (
            <Route path="/admin/users" element={<UsersManagement />} />
          )}
        </Route>
      )}

      {/* Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === 'DONOR' ? (
              <Navigate to="/donor/dashboard" replace />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
