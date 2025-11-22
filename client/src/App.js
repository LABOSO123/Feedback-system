import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BusinessHome from './pages/business/Home';
import BusinessThreads from './pages/business/Threads';
import BusinessDashboardDetail from './pages/business/DashboardDetail';
import DataScienceHome from './pages/datascience/Home';
import DataScienceThreads from './pages/datascience/Threads';
import DataScienceThreadDetail from './pages/datascience/ThreadDetail';
import ContactAdmin from './pages/datascience/ContactAdmin';
import AdminDashboard from './pages/admin/Dashboard';
import Layout from './components/Layout';
import RoleBasedRedirect from './components/RoleBasedRedirect';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    {/* Business Routes */}
                    <Route path="/business/home" element={<BusinessHome />} />
                    <Route path="/business/threads" element={<BusinessThreads />} />
                    <Route path="/business/dashboard/:id" element={<BusinessDashboardDetail />} />
                    
                    {/* Data Science Routes */}
                    <Route path="/datascience/home" element={<DataScienceHome />} />
                    <Route path="/datascience/threads" element={<DataScienceThreads />} />
                    <Route path="/datascience/thread/:id" element={<DataScienceThreadDetail />} />
                    <Route path="/datascience/contact-admin" element={<ContactAdmin />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    
                    {/* Default redirect based on role */}
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<RoleBasedRedirect />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

