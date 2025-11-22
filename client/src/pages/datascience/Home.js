import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DataScienceHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ issues: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updated_at');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTeamIssues();
  }, [sortBy, filterStatus, filterPriority, teamFilter]);

  const fetchTeamIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (teamFilter) params.append('team_filter', teamFilter);
      params.append('sort_by', sortBy);

      const response = await axios.get(`${API_URL}/issues/team/dashboard?${params}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching team issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (issueId) => {
    navigate(`/datascience/thread/${issueId}`);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'complete':
        return 'Complete';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading team issues...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Dashboard Issues</h1>
        <p className="text-sm text-gray-600 mt-1">
          View all issues across all teams. You can optionally contribute to threads from other teams.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{data.summary.pending || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-kra-red-600">{data.summary.in_progress || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Critical</div>
          <div className="text-2xl font-bold text-kra-red-700">{data.summary.critical || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Dashboards</div>
          <div className="text-2xl font-bold text-kra-black-900">{data.summary.total_dashboards || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="updated_at">Most Recent Activity</option>
              <option value="status">Status</option>
              <option value="created_at">Created Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical (2+ seconds)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Filter</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="all">All Teams</option>
              <option value="my_team">My Team</option>
              <option value="other_teams">Other Teams</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {data.issues.map((issue) => (
          <div
            key={issue.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleThreadClick(issue.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(issue.status)}`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {issue.subject || `Thread #${issue.id}`}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-500">{issue.dashboard_name}</p>
              {issue.assigned_team_name && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  issue.is_my_team 
                    ? 'bg-kra-red-50 text-kra-red-800 border border-kra-red-200' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {issue.is_my_team ? 'My Team' : issue.assigned_team_name}
                </span>
              )}
                    {!issue.assigned_team_name && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(issue.status)} text-white`}>
                  {getStatusLabel(issue.status)}
                </span>
                {issue.second_count > 1 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    {issue.second_count} seconds (Critical)
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-700 mb-3">{issue.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex space-x-4">
                <span>By: {issue.submitted_by_name}</span>
                <span>Priority: {issue.second_count || 1}</span>
              </div>
              <div className="flex space-x-2">
                <span>Created: {format(new Date(issue.created_at), 'MMM d, yyyy')}</span>
                <span>Updated: {format(new Date(issue.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.issues.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No issues found.
        </div>
      )}
    </div>
  );
};

export default DataScienceHome;

