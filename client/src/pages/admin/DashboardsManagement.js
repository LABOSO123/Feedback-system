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
    assigned_team_id: '',
    charts: [] // Array to store charts being added during creation/editing
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
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error - please log in again');
      }
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
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error - please log in again');
      }
    }
  };

  const fetchCharts = async (dashboardId) => {
    try {
      const response = await axios.get(`${API_URL}/charts/dashboard/${dashboardId}`);
      setCharts(response.data.charts);
    } catch (error) {
      console.error('Error fetching charts:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error - token may be missing or invalid');
      }
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
      if (error.response?.status === 403) {
        alert('Insufficient permissions. Your token may have expired. Please refresh the page.');
        console.error('403 Error:', error.response?.data);
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.error || 'Failed to save chart');
      }
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
      if (error.response?.status === 403) {
        alert('Insufficient permissions. Your token may have expired. Please refresh the page.');
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.error || 'Failed to delete chart');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let dashboardId;
      
      if (editing) {
        // Update existing dashboard
        const response = await axios.put(`${API_URL}/dashboards/${editing}`, {
          dashboard_name: formData.dashboard_name,
          description: formData.description,
          assigned_team_id: formData.assigned_team_id
        });
        dashboardId = editing;

        // Get existing charts for this dashboard to compare
        const existingChartsResponse = await axios.get(`${API_URL}/charts/dashboard/${dashboardId}`);
        const existingCharts = existingChartsResponse.data.charts;
        const existingChartIds = existingCharts.map(c => c.id);
        const currentChartIds = formData.charts.filter(c => c.id).map(c => c.id);

        // Delete charts that were removed
        const chartsToDelete = existingChartIds.filter(id => !currentChartIds.includes(id));
        for (const chartId of chartsToDelete) {
          await axios.delete(`${API_URL}/charts/${chartId}`);
        }

        // Update or create charts
        for (const chart of formData.charts) {
          if (chart.chart_name && chart.chart_name.trim()) {
            if (chart.id) {
              // Update existing chart
              await axios.put(`${API_URL}/charts/${chart.id}`, {
                chart_name: chart.chart_name.trim(),
                description: chart.description?.trim() || null
              });
            } else {
              // Create new chart
              await axios.post(`${API_URL}/charts`, {
                dashboard_id: dashboardId,
                chart_name: chart.chart_name.trim(),
                description: chart.description?.trim() || null
              });
            }
          }
        }
      } else {
        // Create new dashboard
        const response = await axios.post(`${API_URL}/dashboards`, {
          dashboard_name: formData.dashboard_name,
          description: formData.description,
          assigned_team_id: formData.assigned_team_id
        });
        dashboardId = response.data.dashboard.id;

        // Add charts if any were provided
        if (formData.charts && formData.charts.length > 0) {
          for (const chart of formData.charts) {
            if (chart.chart_name && chart.chart_name.trim()) {
              await axios.post(`${API_URL}/charts`, {
                dashboard_id: dashboardId,
                chart_name: chart.chart_name.trim(),
                description: chart.description?.trim() || null
              });
            }
          }
        }
      }

      setShowForm(false);
      setEditing(null);
      setFormData({ dashboard_name: '', description: '', assigned_team_id: '', charts: [] });
      fetchDashboards();
      
      // If we just created a dashboard, select it to show the charts
      if (!editing && dashboardId) {
        setTimeout(async () => {
          try {
            const updatedDashboards = await axios.get(`${API_URL}/dashboards`);
            const newDashboard = updatedDashboards.data.dashboards.find(d => d.id === dashboardId);
            if (newDashboard) {
              handleSelectDashboard(newDashboard);
            }
          } catch (err) {
            console.error('Error selecting new dashboard:', err);
          }
        }, 500);
      } else if (editing && dashboardId) {
        // Refresh charts if editing
        fetchCharts(dashboardId);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Insufficient permissions. Your token may have expired. Please refresh the page.');
        console.error('403 Error:', error.response?.data);
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.error || 'Failed to save dashboard');
      }
    }
  };

  const handleEdit = async (dashboard) => {
    setEditing(dashboard.id);
    setFormData({
      dashboard_name: dashboard.dashboard_name,
      description: dashboard.description || '',
      assigned_team_id: dashboard.assigned_team_id || '',
      charts: [] // Start with empty charts array for editing
    });
    
    // Fetch existing charts for this dashboard
    try {
      const chartsResponse = await axios.get(`${API_URL}/charts/dashboard/${dashboard.id}`);
      setFormData(prev => ({
        ...prev,
        charts: chartsResponse.data.charts.map(chart => ({
          id: chart.id, // Keep existing chart ID
          chart_name: chart.chart_name,
          description: chart.description || ''
        }))
      }));
    } catch (error) {
      console.error('Error fetching charts:', error);
    }
    
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
      if (error.response?.status === 403) {
        alert('Insufficient permissions. Your token may have expired. Please refresh the page.');
      } else if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.error || 'Failed to delete dashboard');
      }
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
            setFormData({ dashboard_name: '', description: '', assigned_team_id: '', charts: [] });
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
              {/* Charts/Visuals Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Charts/Visuals
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add charts/visuals to this dashboard {editing ? '(existing charts shown below)' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        charts: [...(formData.charts || []), { chart_name: '', description: '' }]
                      });
                    }}
                    className="text-sm text-kra-red-600 hover:text-kra-red-700 font-medium whitespace-nowrap"
                  >
                    + Add Chart/Visual
                  </button>
                </div>
                
                {formData.charts && formData.charts.length > 0 && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {formData.charts.map((chart, index) => (
                      <div key={chart.id || index} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-600">
                              Chart {index + 1}
                              {chart.id && <span className="text-gray-400 ml-1">(existing)</span>}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newCharts = formData.charts.filter((_, i) => i !== index);
                              setFormData({ ...formData, charts: newCharts });
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Chart/Visual Name *"
                            value={chart.chart_name || ''}
                            onChange={(e) => {
                              const newCharts = [...formData.charts];
                              newCharts[index] = { ...newCharts[index], chart_name: e.target.value };
                              setFormData({ ...formData, charts: newCharts });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 text-sm"
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={chart.description || ''}
                            onChange={(e) => {
                              const newCharts = [...formData.charts];
                              newCharts[index] = { ...newCharts[index], description: e.target.value };
                              setFormData({ ...formData, charts: newCharts });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {(!formData.charts || formData.charts.length === 0) && (
                  <p className="text-sm text-gray-500 italic">No charts/visuals added yet. Click "+ Add Chart/Visual" to add one.</p>
                )}
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
                >
                  {editing ? 'Update Dashboard' : 'Create Dashboard'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setFormData({ dashboard_name: '', description: '', assigned_team_id: '', charts: [] });
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

