import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const BusinessThreads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updated_at');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchMyThreads();
  }, [sortBy, filterStatus]);

  useEffect(() => {
    if (selectedIssue) {
      fetchComments();
    }
  }, [selectedIssue]);

  const fetchMyThreads = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      params.append('sort_by', sortBy);

      const response = await axios.get(`${API_URL}/issues/my-threads?${params}`);
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments/issue/${selectedIssue.id}`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleDeleteThread = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/issues/${issueId}`);
      fetchMyThreads();
      if (selectedIssue?.id === issueId) {
        setSelectedIssue(null);
        setComments([]);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete thread');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/comments`, {
        issue_id: selectedIssue.id,
        comment_text: newComment
      });
      setNewComment('');
      fetchComments();
      fetchMyThreads();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return <div className="text-center py-12">Loading your threads...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Threads</h1>

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
              <option value="updated_at">Date Modified</option>
              <option value="status">Status</option>
              <option value="created_at">Date Created</option>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Threads List */}
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
                  className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
                selectedIssue?.id === issue.id ? 'border-kra-red-500 ring-2 ring-kra-red-200' : 'border-gray-200'
              }`}
              onClick={() => setSelectedIssue(issue)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(issue.status)}`}></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {issue.subject || `Thread #${issue.id}`}
                    </h3>
                    <p className="text-sm text-gray-500">{issue.dashboard_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(issue.status)} text-white`}>
                    {getStatusLabel(issue.status)}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-2 line-clamp-2">{issue.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Updated: {format(new Date(issue.updated_at), 'MMM d, yyyy')}</span>
                {issue.submitted_by_user_id === user.id && issue.status !== 'in_progress' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(issue.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Thread Detail and Comments */}
        {selectedIssue && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{selectedIssue.subject || `Thread #${selectedIssue.id}`}</h2>
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedIssue.status)} text-white`}>
                  {getStatusLabel(selectedIssue.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Dashboard: {selectedIssue.dashboard_name}</p>
              <p className="text-gray-700">{selectedIssue.description}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Replies</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">{comment.user_name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {comment.user_role === 'data_science' ? 'Data Science' : 'Business'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment_text}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-gray-500">No replies yet.</p>
                )}
              </div>

              {selectedIssue.status !== 'complete' && selectedIssue.submitted_by_user_id === user.id && (
                <form onSubmit={handleSubmitComment}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Add a reply..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 mb-2"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {issues.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          You haven't created or seconded any threads yet.
        </div>
      )}
    </div>
  );
};

export default BusinessThreads;

