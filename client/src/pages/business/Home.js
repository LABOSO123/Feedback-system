import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const BusinessHome = () => {
  const [dashboards, setDashboards] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allDashboards, setAllDashboards] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sortBy, setSortBy] = useState('dashboard_name');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    dashboard_id: '',
    chart_id: '',
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboards();
    fetchTeams();
    fetchAllDashboards();
  }, [selectedTeam, sortBy, searchTerm]);

  useEffect(() => {
    if (feedbackData.dashboard_id) {
      fetchChartsForDashboard(feedbackData.dashboard_id);
    } else {
      setCharts([]);
      setFeedbackData({ ...feedbackData, chart_id: '' });
    }
  }, [feedbackData.dashboard_id]);

  const fetchDashboards = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTeam) params.append('team_id', selectedTeam);
      if (searchTerm) params.append('search', searchTerm);
      params.append('sort_by', sortBy);

      const response = await axios.get(`${API_URL}/dashboards/with-threads/count?${params}`);
      setDashboards(response.data.dashboards);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
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

  const fetchAllDashboards = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboards`);
      setAllDashboards(response.data.dashboards);
    } catch (error) {
      console.error('Error fetching all dashboards:', error);
    }
  };

  const fetchChartsForDashboard = async (dashboardId) => {
    try {
      const response = await axios.get(`${API_URL}/charts/dashboard/${dashboardId}`);
      setCharts(response.data.charts);
    } catch (error) {
      console.error('Error fetching charts:', error);
      setCharts([]);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackData.dashboard_id || !feedbackData.description) {
      alert('Please select a dashboard and provide a description');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/issues`, {
        dashboard_id: feedbackData.dashboard_id,
        chart_id: feedbackData.chart_id || null,
        subject: feedbackData.subject || null,
        description: feedbackData.description
      });
      setShowFeedbackForm(false);
      setFeedbackData({ dashboard_id: '', chart_id: '', subject: '', description: '' });
      fetchDashboards(); // Refresh to show new thread count
      alert('Feedback submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDashboardClick = (dashboardId) => {
    navigate(`/business/dashboard/${dashboardId}`);
  };

  const handleAddNewThread = (dashboardId) => {
    navigate(`/business/dashboard/${dashboardId}?new=true`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboards...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Feedback</h1>
          <button
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
          >
            {showFeedbackForm ? 'Cancel' : '+ Create Feedback'}
          </button>
        </div>

        {/* Global Feedback Form */}
        {showFeedbackForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4 border-2 border-kra-red-200">
            <h2 className="text-lg font-semibold mb-4">Create New Feedback</h2>
            <form onSubmit={handleSubmitFeedback}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Dashboard *
                  </label>
                  <select
                    required
                    value={feedbackData.dashboard_id}
                    onChange={(e) => setFeedbackData({ ...feedbackData, dashboard_id: e.target.value, chart_id: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                  >
                    <option value="">Choose a dashboard...</option>
                    {allDashboards.map((dashboard) => (
                      <option key={dashboard.id} value={dashboard.id}>
                        {dashboard.dashboard_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Visual/Chart (Optional)
                  </label>
                  <select
                    value={feedbackData.chart_id}
                    onChange={(e) => setFeedbackData({ ...feedbackData, chart_id: e.target.value })}
                    disabled={!feedbackData.dashboard_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">No specific visual (dashboard feedback)</option>
                    {charts.map((chart) => (
                      <option key={chart.id} value={chart.id}>
                        {chart.chart_name}
                      </option>
                    ))}
                  </select>
                  {!feedbackData.dashboard_id && (
                    <p className="text-xs text-gray-500 mt-1">Select a dashboard first</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedbackData.subject}
                    onChange={(e) => setFeedbackData({ ...feedbackData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                    placeholder="Brief subject for your feedback"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    value={feedbackData.description}
                    onChange={(e) => setFeedbackData({ ...feedbackData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                    placeholder="Describe your feedback or issue..."
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setFeedbackData({ dashboard_id: '', chart_id: '', subject: '', description: '' });
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search dashboards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
              >
                <option value="dashboard_name">Name (A-Z)</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="thread_count">Thread Count</option>
                <option value="updated_at">Date Modified</option>
                <option value="created_at">Date Created</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleDashboardClick(dashboard.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{dashboard.dashboard_name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNewThread(dashboard.id);
                }}
                className="text-kra-red-600 hover:text-kra-red-700 text-2xl font-bold"
                title="Add new thread"
              >
                +
              </button>
            </div>
            {dashboard.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{dashboard.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>{dashboard.thread_count || 0} thread(s)</span>
              {dashboard.priority && dashboard.priority !== 'none' && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  dashboard.priority === 'high' 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : dashboard.priority === 'medium'
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                  {dashboard.priority === 'high' ? '🔴 High Priority' : dashboard.priority === 'medium' ? '🟠 Medium Priority' : '🟡 Low Priority'}
                </span>
              )}
            </div>
            {dashboard.team_name && (
              <div className="flex items-center justify-between">
                <span className="bg-kra-red-50 text-kra-red-800 px-2 py-1 rounded text-xs border border-kra-red-200">
                  {dashboard.team_name}
                </span>
              </div>
            )}
            {dashboard.updated_at && (
              <p className="text-xs text-gray-400 mt-2">
                Updated: {format(new Date(dashboard.updated_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        ))}
      </div>

      {dashboards.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No dashboards found. {searchTerm && 'Try adjusting your search filters.'}
        </div>
      )}
    </div>
  );
};

export default BusinessHome;

