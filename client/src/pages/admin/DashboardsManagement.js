import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const DashboardsManagement = () => {
  const [dashboards, setDashboards] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [charts, setCharts] = useState([]);
  const [showChartForm, setShowChartForm] = useState(false);
  const [editingChart, setEditingChart] = useState(null);
  const [formData, setFormData] = useState({
    dashboard_name: '',
    description: '',
    assigned_team_id: ''
  });
  const [chartFormData, setChartFormData] = useState({
    chart_name: '',
    description: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboards();
    fetchTeams();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboards`);
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

  const fetchCharts = async (dashboardId) => {
    try {
      const response = await axios.get(`${API_URL}/charts/dashboard/${dashboardId}`);
      setCharts(response.data.charts);
    } catch (error) {
      console.error('Error fetching charts:', error);
    }
  };

  const handleSelectDashboard = (dashboard) => {
    setSelectedDashboard(dashboard.id);
    fetchCharts(dashboard.id);
    setShowForm(false);
    setShowChartForm(false);
  };

  const handleChartSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChart) {
        await axios.put(`${API_URL}/charts/${editingChart}`, chartFormData);
      } else {
        await axios.post(`${API_URL}/charts`, {
          ...chartFormData,
          dashboard_id: selectedDashboard
        });
      }
      setShowChartForm(false);
      setEditingChart(null);
      setChartFormData({ chart_name: '', description: '' });
      if (selectedDashboard) {
        fetchCharts(selectedDashboard);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save chart');
    }
  };

  const handleEditChart = (chart) => {
    setEditingChart(chart.id);
    setChartFormData({
      chart_name: chart.chart_name,
      description: chart.description || ''
    });
    setShowChartForm(true);
  };

  const handleDeleteChart = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chart/visual?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/charts/${id}`);
      if (selectedDashboard) {
        fetchCharts(selectedDashboard);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete chart');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/dashboards/${editing}`, formData);
      } else {
        await axios.post(`${API_URL}/dashboards`, formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ dashboard_name: '', description: '', assigned_team_id: '' });
      fetchDashboards();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save dashboard');
    }
  };

  const handleEdit = (dashboard) => {
    setEditing(dashboard.id);
    setFormData({
      dashboard_name: dashboard.dashboard_name,
      description: dashboard.description || '',
      assigned_team_id: dashboard.assigned_team_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/dashboards/${id}`);
      fetchDashboards();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete dashboard');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Dashboards Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ dashboard_name: '', description: '', assigned_team_id: '' });
          }}
          className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
        >
          + Add Dashboard
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Dashboard' : 'Create Dashboard'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dashboard Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dashboard_name}
                  onChange={(e) => setFormData({ ...formData, dashboard_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Team
                </label>
                <select
                  value={formData.assigned_team_id}
                  onChange={(e) => setFormData({ ...formData, assigned_team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                >
                  <option value="">No team assigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setFormData({ dashboard_name: '', description: '', assigned_team_id: '' });
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dashboards List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Dashboards</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedDashboard === dashboard.id ? 'bg-kra-red-50 border-l-4 border-kra-red-600' : ''
                }`}
                onClick={() => handleSelectDashboard(dashboard)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{dashboard.dashboard_name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{dashboard.description || 'No description'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dashboard.team_name || 'No team'} • {format(new Date(dashboard.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(dashboard)}
                      className="text-kra-red-600 hover:text-kra-red-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dashboard.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts/Visuals Management */}
        {selectedDashboard ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Charts/Visuals for: {dashboards.find(d => d.id === selectedDashboard)?.dashboard_name}
              </h3>
              <button
                onClick={() => {
                  setShowChartForm(true);
                  setEditingChart(null);
                  setChartFormData({ chart_name: '', description: '' });
                }}
                className="bg-kra-red-600 text-white px-3 py-1.5 rounded-md hover:bg-kra-red-700 text-sm font-medium"
              >
                + Add Chart
              </button>
            </div>

            {showChartForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <h4 className="font-semibold mb-3">{editingChart ? 'Edit Chart' : 'Add New Chart/Visual'}</h4>
                <form onSubmit={handleChartSubmit}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chart/Visual Name *</label>
                      <input
                        type="text"
                        required
                        value={chartFormData.chart_name}
                        onChange={(e) => setChartFormData({ ...chartFormData, chart_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 text-sm"
                        placeholder="e.g., Revenue Chart, Sales Table"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={chartFormData.description}
                        onChange={(e) => setChartFormData({ ...chartFormData, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 text-sm"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-kra-red-600 text-white px-3 py-1.5 rounded-md hover:bg-kra-red-700 text-sm font-medium"
                      >
                        {editingChart ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChartForm(false);
                          setEditingChart(null);
                          setChartFormData({ chart_name: '', description: '' });
                        }}
                        className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {charts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No charts/visuals added yet</p>
              ) : (
                charts.map((chart) => (
                  <div key={chart.id} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{chart.chart_name}</p>
                      {chart.description && (
                        <p className="text-xs text-gray-500 mt-1">{chart.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditChart(chart)}
                        className="text-kra-red-600 hover:text-kra-red-700 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteChart(chart.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
            <p className="text-gray-500">Select a dashboard to manage its charts/visuals</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardsManagement;

