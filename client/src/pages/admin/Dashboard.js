import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardsManagement from './DashboardsManagement';
import TeamsManagement from './TeamsManagement';
import UsersManagement from './UsersManagement';
import IssuesManagement from './IssuesManagement';
import AdminRequests from './AdminRequests';
import AdminStats from './AdminStats';

const AdminDashboard = () => {
  const location = useLocation();

  const tabs = [
    { path: '/admin', label: 'Overview', exact: true },
    { path: '/admin/dashboards', label: 'Dashboards' },
    { path: '/admin/teams', label: 'Teams' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/issues', label: 'Issues' },
    { path: '/admin/requests', label: 'Requests' },
  ];

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`${
                (tab.exact && location.pathname === tab.path) ||
                (!tab.exact && location.pathname.startsWith(tab.path))
                  ? 'border-kra-red-600 text-kra-red-600'
                  : 'border-transparent text-gray-600 hover:text-kra-black-900 hover:border-kra-red-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<AdminStats />} />
        <Route path="/dashboards" element={<DashboardsManagement />} />
        <Route path="/teams" element={<TeamsManagement />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/issues" element={<IssuesManagement />} />
        <Route path="/requests" element={<AdminRequests />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;

