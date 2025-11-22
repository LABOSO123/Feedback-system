import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [dashboardProgress, setDashboardProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchStats();
    fetchPendingRequests();
    fetchDashboardProgress();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin-requests?status=pending`);
      setPendingRequests(response.data.requests.length);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const fetchDashboardProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboards`);
      const dashboards = response.data.dashboards;
      
      // Get issues for each dashboard
      const progressPromises = dashboards.map(async (dashboard) => {
        try {
          const issuesResponse = await axios.get(`${API_URL}/issues?dashboard_id=${dashboard.id}`);
          const issues = issuesResponse.data.issues;
          
          return {
            id: dashboard.id,
            name: dashboard.dashboard_name,
            total: issues.length,
            pending: issues.filter(i => i.status === 'pending').length,
            in_progress: issues.filter(i => i.status === 'in_progress').length,
            complete: issues.filter(i => i.status === 'complete').length,
            team: dashboard.team_name || 'Unassigned'
          };
        } catch (error) {
          return {
            id: dashboard.id,
            name: dashboard.dashboard_name,
            total: 0,
            pending: 0,
            in_progress: 0,
            complete: 0,
            team: dashboard.team_name || 'Unassigned'
          };
        }
      });
      
      const progress = await Promise.all(progressPromises);
      setDashboardProgress(progress);
    } catch (error) {
      console.error('Error fetching dashboard progress:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Business Users</div>
          <div className="text-2xl font-bold text-kra-red-600">{stats?.business_users || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Data Science Users</div>
          <div className="text-2xl font-bold text-kra-red-500">{stats?.data_science_users || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Teams</div>
          <div className="text-2xl font-bold text-kra-black-900">{stats?.total_teams || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Dashboards</div>
          <div className="text-2xl font-bold text-kra-red-700">{stats?.total_dashboards || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending Issues</div>
          <div className="text-2xl font-bold text-yellow-600">{stats?.pending_issues || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">In Progress Issues</div>
          <div className="text-2xl font-bold text-kra-red-600">{stats?.in_progress_issues || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Completed Issues</div>
          <div className="text-2xl font-bold text-kra-black-900">{stats?.completed_issues || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending Admin Requests</div>
          <div className="text-2xl font-bold text-kra-red-600">{pendingRequests}</div>
        </div>
      </div>

      {/* Dashboard Progress Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Dashboard Progress Overview</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dashboard
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Threads
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Progress
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complete
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardProgress.map((dashboard) => {
                const completionRate = dashboard.total > 0 
                  ? Math.round((dashboard.complete / dashboard.total) * 100) 
                  : 0;
                return (
                  <tr key={dashboard.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dashboard.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{dashboard.team}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-900">{dashboard.total}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-yellow-600">{dashboard.pending}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-kra-red-600">{dashboard.in_progress}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-kra-black-900">{dashboard.complete}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-kra-red-600 h-2 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-12">{completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {dashboardProgress.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No dashboards found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;

