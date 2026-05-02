import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ConsumerDashboard from './components/ConsumerDashboard';
import ApiManager from './components/ApiManager';
import ApiKeyManager from './components/ApiKeyManager';
import BillingPage from './components/BillingPage';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import SystemSettings from './components/SystemSettings';
import AllApisView from './components/AllApisView';
import PaymentPortal from './components/PaymentPortal';

const queryClient = new QueryClient();

// Role-based route guard
function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'api_owner') return <Navigate to="/" />;
    if (userRole === 'consumer') return <Navigate to="/consumer" />;
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* API Owner Dashboard */}
          <Route path="/" element={
            <PrivateRoute allowedRoles={['api_owner', 'admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Consumer Dashboard */}
          <Route path="/consumer" element={
            <PrivateRoute allowedRoles={['consumer']}>
              <Layout>
                <ConsumerDashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* API Management (Owner only) */}
          <Route path="/apis" element={
            <PrivateRoute allowedRoles={['api_owner', 'admin']}>
              <Layout>
                <ApiManager />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/apis/:apiId/keys" element={
            <PrivateRoute allowedRoles={['api_owner', 'admin']}>
              <Layout>
                <ApiKeyManager />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Billing (All roles) */}
          <Route path="/billing" element={
            <PrivateRoute allowedRoles={['api_owner', 'consumer', 'admin']}>
              <Layout>
                <BillingPage />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Admin Only Routes */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout>
                <UserManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin/apis" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout>
                <AllApisView />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Layout>
                <SystemSettings />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/payment" element={
            <PrivateRoute>
            <PaymentPortal />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;