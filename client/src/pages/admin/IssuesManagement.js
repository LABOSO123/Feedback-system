import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const IssuesManagement = () => {
  const [issues, setIssues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterDashboard, setFilterDashboard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboards();
    fetchTeams();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [filterDashboard, filterStatus, filterTeam]);

  const fetchDashboards = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboards`);
      setDashboards(response.data.dashboards);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    }
  };

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDashboard) params.append('dashboard_id', filterDashboard);
      if (filterStatus) params.append('status', filterStatus);
      if (filterTeam) {
        params.append('assigned_team_id', filterTeam);
      }

      const response = await axios.get(`${API_URL}/issues?${params}`);
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_URL}/teams`);
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssignTeam = async (issueId, teamId) => {
    try {
      await axios.post(`${API_URL}/admin/issues/${issueId}/assign-team`, { team_id: teamId });
      fetchIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign team');
    }
  };

  const handleAssignUser = async (issueId, userId) => {
    try {
      await axios.post(`${API_URL}/admin/issues/${issueId}/assign-user`, { user_id: userId });
      fetchIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign user');
    }
  };

  const handleUpdateStatus = async (issueId, status) => {
    try {
      await axios.put(`${API_URL}/admin/issues/${issueId}`, { status });
      fetchIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in_progress':
        return 'bg-kra-red-500';
      case 'complete':
        return 'bg-kra-black-900';
      default:
        return 'bg-gray-400';
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Issues Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            ℹ️ Issues are automatically assigned to the dashboard's team when created. Status changes to "in_progress" when team members reply.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Dashboard</label>
            <select
              value={filterDashboard}
              onChange={(e) => setFilterDashboard(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Dashboards</option>
              {dashboards.map((dashboard) => (
                <option key={dashboard.id} value={dashboard.id}>
                  {dashboard.dashboard_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Team</label>
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Teams</option>
              <option value="unassigned">Unassigned</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dashboard
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chart/Visual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.map((issue) => (
              <tr key={issue.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{issue.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{issue.dashboard_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{issue.chart_name || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate" title={issue.subject || issue.description}>
                    {issue.subject || `Thread #${issue.id}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{issue.submitted_by_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(issue.status)} text-white inline-block`}>
                      {issue.status === 'pending' ? 'Pending' : issue.status === 'in_progress' ? 'In Progress' : 'Complete'}
                    </span>
                    {issue.status === 'in_progress' && (
                      <span className="text-xs text-gray-500 mt-1">Auto: Team replied</span>
                    )}
                    {issue.status === 'complete' && (
                      <span className="text-xs text-gray-500 mt-1">Marked by team</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {issue.assigned_team_name || 'Unassigned'}
                    {!issue.assigned_team_id && (
                      <span className="text-xs text-gray-400 ml-1">(Auto-assigns from dashboard)</span>
                    )}
                  </div>
                  {/* Manual override option (kept for edge cases) */}
                  <select
                    value={issue.assigned_team_id || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignTeam(issue.id, e.target.value);
                      }
                    }}
                    className="text-xs border border-gray-300 rounded-md px-1 py-0.5 mt-1 focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                    title="Manual override (normally auto-assigned from dashboard)"
                  >
                    <option value="">Change team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {issue.calculated_priority || issue.priority || 1}
                    {issue.second_count > 0 && (
                      <span className="text-xs text-gray-500 ml-1">({issue.second_count} seconds)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(issue.created_at), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(issue.updated_at), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Status is now automatic - no manual control needed */}
                  <div className="text-xs text-gray-500">
                    Auto-managed
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IssuesManagement;

