import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const ContactAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    request_type: '',
    dashboard_id: '',
    subject: '',
    description: ''
  });
  const [dashboards, setDashboards] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchDashboards();
    fetchMyRequests();
  }, []);

  const fetchDashboards = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboards`);
      setDashboards(response.data.dashboards);
    } catch (error) {
      console.error('Error fetching dashboards:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin-requests`);
      setMyRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.request_type || !formData.subject || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Ensure token is in headers
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in again.');
        return;
      }

      const response = await axios.post(`${API_URL}/admin-requests`, {
        ...formData,
        team_id: user.team_id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess(true);
      setFormData({
        request_type: '',
        dashboard_id: '',
        subject: '',
        description: ''
      });
      fetchMyRequests();
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Submit request error:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        // Redirect to login after a moment
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/admin-requests/${requestId}`);
      fetchMyRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete request');
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      'new_dashboard': 'New Dashboard',
      'add_chart': 'Add Chart',
      'add_team_member': 'Add Team Member',
      'modify_dashboard': 'Modify Dashboard',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in_progress':
        return 'bg-kra-red-500';
      case 'resolved':
        return 'bg-kra-black-900';
      case 'rejected':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-kra-black-900 mb-2">Contact Admin</h1>
        <p className="text-sm text-gray-600">
          Submit requests to the admin for dashboard changes, team management, or other system modifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Submit New Request</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-kra-red-50 border border-kra-red-200 text-kra-red-800 px-4 py-3 rounded mb-4">
              Request submitted successfully! The admin will review it.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type *
                </label>
                <select
                  name="request_type"
                  value={formData.request_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                >
                  <option value="">Select request type</option>
                  <option value="new_dashboard">New Dashboard</option>
                  <option value="add_chart">Add Chart to Dashboard</option>
                  <option value="add_team_member">Add Team Member</option>
                  <option value="modify_dashboard">Modify Dashboard</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {(formData.request_type === 'add_chart' || formData.request_type === 'modify_dashboard') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dashboard *
                  </label>
                  <select
                    name="dashboard_id"
                    value={formData.dashboard_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                  >
                    <option value="">Select dashboard</option>
                    {dashboards.map((dashboard) => (
                      <option key={dashboard.id} value={dashboard.id}>
                        {dashboard.dashboard_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief summary of your request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Provide detailed information about your request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {/* My Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Requests</h2>
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="text-sm text-kra-red-600 hover:text-kra-red-700 font-medium"
            >
              {showRequests ? 'Hide' : 'Show'} ({myRequests.length})
            </button>
          </div>

          {showRequests && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myRequests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No requests submitted yet.</p>
              ) : (
                myRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.subject}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {getRequestTypeLabel(request.request_type)}
                          {request.dashboard_name && ` • ${request.dashboard_name}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(request.status)} text-white`}>
                          {getStatusLabel(request.status)}
                        </span>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{request.description}</p>
                    {request.admin_response && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-gray-900 mb-1">Admin Response:</p>
                        <p className="text-gray-700">{request.admin_response}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;



