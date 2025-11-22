import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [updating, setUpdating] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, filterType]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('request_type', filterType);

      const response = await axios.get(`${API_URL}/admin-requests?${params}`);
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    setUpdating(true);
    try {
      await axios.patch(`${API_URL}/admin-requests/${requestId}/status`, {
        status: status,
        admin_response: adminResponse || null
      });
      setSelectedRequest(null);
      setAdminResponse('');
      fetchRequests();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
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

  if (loading) {
    return <div className="text-center py-12">Loading requests...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Requests</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex space-x-4">
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
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
            >
              <option value="">All Types</option>
              <option value="new_dashboard">New Dashboard</option>
              <option value="add_chart">Add Chart</option>
              <option value="add_team_member">Add Team Member</option>
              <option value="modify_dashboard">Modify Dashboard</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
                selectedRequest?.id === request.id ? 'border-kra-red-500 ring-2 ring-kra-red-200' : 'border-gray-200'
              }`}
              onClick={() => {
                setSelectedRequest(request);
                setAdminResponse(request.admin_response || '');
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{request.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {getRequestTypeLabel(request.request_type)}
                    {request.dashboard_name && ` • ${request.dashboard_name}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(request.status)} text-white`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{request.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>By: {request.submitted_by_name}</span>
                <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Request Detail & Actions */}
        {selectedRequest && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">{selectedRequest.subject}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedRequest.status)} text-white`}>
                  {getStatusLabel(selectedRequest.status)}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p><strong>Type:</strong> {getRequestTypeLabel(selectedRequest.request_type)}</p>
                {selectedRequest.dashboard_name && (
                  <p><strong>Dashboard:</strong> {selectedRequest.dashboard_name}</p>
                )}
                {selectedRequest.team_name && (
                  <p><strong>Team:</strong> {selectedRequest.team_name}</p>
                )}
                <p><strong>Submitted by:</strong> {selectedRequest.submitted_by_name} ({selectedRequest.submitted_by_email})</p>
                <p><strong>Date:</strong> {format(new Date(selectedRequest.created_at), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Description:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
              {selectedRequest.admin_response && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Previous Admin Response:</h4>
                  <p className="text-gray-700">{selectedRequest.admin_response}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Admin Response (Optional):</h4>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={3}
                placeholder="Add your response or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 mb-4"
              />
              <div className="flex space-x-2">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                      disabled={updating}
                      className="flex-1 bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'resolved')}
                      disabled={updating}
                      className="flex-1 bg-kra-black-900 text-white px-4 py-2 rounded-md hover:bg-kra-black-800 disabled:opacity-50 font-medium"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                      disabled={updating}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedRequest.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'resolved')}
                      disabled={updating}
                      className="flex-1 bg-kra-black-900 text-white px-4 py-2 rounded-md hover:bg-kra-black-800 disabled:opacity-50 font-medium"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                      disabled={updating}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(selectedRequest.status === 'resolved' || selectedRequest.status === 'rejected') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'in_progress')}
                    disabled={updating}
                    className="flex-1 bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {requests.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No admin requests found.
        </div>
      )}
    </div>
  );
};

export default AdminRequests;



