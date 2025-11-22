import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DataScienceThreads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updated_at');
  const [filterStatus, setFilterStatus] = useState('');
  const [groupByDashboard, setGroupByDashboard] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchThreads();
  }, [sortBy, filterStatus, teamFilter]);

  const fetchThreads = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (teamFilter) params.append('team_filter', teamFilter);
      params.append('sort_by', sortBy);

      const response = await axios.get(`${API_URL}/issues/team/dashboard?${params}`);
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (issueId) => {
    navigate(`/datascience/thread/${issueId}`);
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/issues/${issueId}/status`, { status: newStatus });
      fetchThreads();
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

  // Group issues by dashboard if enabled
  const groupedIssues = groupByDashboard
    ? issues.reduce((acc, issue) => {
        const key = issue.dashboard_name || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(issue);
        return acc;
      }, {})
    : null;

  if (loading) {
    return <div className="text-center py-12">Loading threads...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Threads</h1>
        <p className="text-sm text-gray-600 mt-1">
          View threads from all teams. Contribution to other teams' threads is optional.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex space-x-4 items-end">
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="groupByDashboard"
              checked={groupByDashboard}
              onChange={(e) => setGroupByDashboard(e.target.checked)}
              className="h-4 w-4 text-kra-red-600 focus:ring-kra-red-500 border-gray-300 rounded"
            />
            <label htmlFor="groupByDashboard" className="ml-2 block text-sm text-gray-700">
              Group by Dashboard
            </label>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {groupByDashboard && groupedIssues ? (
        <div className="space-y-6">
          {Object.entries(groupedIssues).map(([dashboardName, dashboardIssues]) => (
            <div key={dashboardName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">{dashboardName}</h2>
              <div className="space-y-3">
                {dashboardIssues.map((issue) => (
                  <ThreadCard
                    key={issue.id}
                    issue={issue}
                    user={user}
                    onClick={() => handleThreadClick(issue.id)}
                    onUpdateStatus={handleUpdateStatus}
                    getStatusColor={getStatusColor}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <ThreadCard
              key={issue.id}
              issue={issue}
              user={user}
              onClick={() => handleThreadClick(issue.id)}
              onUpdateStatus={handleUpdateStatus}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />
          ))}
        </div>
      )}

      {issues.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No threads found.
        </div>
      )}
    </div>
  );
};

const ThreadCard = ({ issue, onClick, onUpdateStatus, getStatusColor, getStatusLabel, user }) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    await onUpdateStatus(issue.id, newStatus);
    setUpdating(false);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
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
        </div>
      </div>
      <p className="text-gray-700 mb-3 text-sm line-clamp-2">{issue.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex space-x-4">
          <span>By: {issue.submitted_by_name}</span>
          <span>Updated: {format(new Date(issue.updated_at), 'MMM d, yyyy')}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {issue.status === 'pending' && issue.is_my_team && (
            <button
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={updating}
              className="text-xs bg-kra-red-100 text-kra-red-800 px-2 py-1 rounded hover:bg-kra-red-200 disabled:opacity-50 border border-kra-red-200"
            >
              Mark In Progress
            </button>
          )}
          {issue.status === 'in_progress' && issue.is_my_team && (
            <button
              onClick={() => handleStatusUpdate('complete')}
              disabled={updating}
              className="text-xs bg-kra-black-900 text-white px-2 py-1 rounded hover:bg-kra-black-800 disabled:opacity-50"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataScienceThreads;

