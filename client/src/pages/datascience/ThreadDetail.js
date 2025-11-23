import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DataScienceThreadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchIssue();
    fetchComments();
  }, [id]);

  const fetchIssue = async () => {
    try {
      const response = await axios.get(`${API_URL}/issues/${id}`);
      setIssue(response.data.issue);
    } catch (error) {
      console.error('Error fetching issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments/issue/${id}`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/comments`, {
        issue_id: id,
        comment_text: newComment
      });
      setNewComment('');
      fetchComments();
      fetchIssue();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (newStatus === 'complete') {
      // Check if there's a reply from data science team
      const hasReply = comments.some(c => c.user_role === 'data_science');
      if (!hasReply) {
        alert('You must reply to the thread before marking it as complete');
        return;
      }
    }

    setUpdatingStatus(true);
    try {
      await axios.patch(`${API_URL}/issues/${id}/status`, { status: newStatus });
      fetchIssue();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
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

  if (loading) {
    return <div className="text-center py-12">Loading thread...</div>;
  }

  if (!issue) {
    return <div className="text-center py-12">Thread not found</div>;
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/datascience/home')}
        className="mb-4 text-kra-red-600 hover:text-kra-red-700 font-medium"
      >
        ← Back to Home
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {issue.subject || `Thread #${issue.id}`}
            </h1>
            <p className="text-sm text-gray-600 mb-2">Dashboard: {issue.dashboard_name}</p>
            {issue.chart_name && (
              <p className="text-sm text-gray-600 mb-2">Chart: {issue.chart_name}</p>
            )}
            {issue.assigned_team_name && (
              <p className="text-sm text-gray-600 mb-2">
                Assigned Team: <span className="font-medium">{issue.assigned_team_name}</span>
            {issue.assigned_team_id === user.team_id && (
              <span className="ml-2 text-xs bg-kra-red-50 text-kra-red-800 px-2 py-0.5 rounded border border-kra-red-200">My Team</span>
            )}
              </p>
            )}
            {!issue.assigned_team_name && (
              <p className="text-sm text-yellow-600 mb-2">Status: Unassigned</p>
            )}
            <p className="text-gray-700 mt-4">{issue.description}</p>
          </div>
          <div className="text-right">
            <span className={`text-sm px-3 py-1 rounded ${getStatusColor(issue.status)} text-white`}>
              {issue.status === 'pending' ? 'Pending' : issue.status === 'in_progress' ? 'In Progress' : 'Complete'}
            </span>
            {issue.second_count > 1 && (
              <div className="mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                {issue.second_count} seconds (Critical)
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Submitted by: {issue.submitted_by_name}</span>
            <span className="text-sm text-gray-500">
              Created: {format(new Date(issue.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Status Update */}
      {issue.status !== 'complete' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <h3 className="font-semibold mb-2">Update Status</h3>
          {issue.assigned_team_id !== user.team_id && (
            <p className="text-sm text-gray-600 mb-2">
              ℹ️ This thread is assigned to <strong>{issue.assigned_team_name}</strong>. 
              You can optionally contribute by replying below if you have insights to share.
            </p>
          )}
          <div className="flex space-x-2">
            {issue.status === 'pending' && issue.assigned_team_id === user.team_id && (
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={updatingStatus}
                className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
              >
                Mark as In Progress
              </button>
            )}
            {issue.status === 'in_progress' && issue.assigned_team_id === user.team_id && (
              <button
                onClick={() => handleUpdateStatus('complete')}
                disabled={updatingStatus}
                className="bg-kra-black-900 text-white px-4 py-2 rounded-md hover:bg-kra-black-800 disabled:opacity-50 font-medium"
              >
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Replies</h2>
        
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{comment.user_name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {comment.user_role === 'data_science' ? 'Data Science' : 'Business'}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <p className="text-gray-700">{comment.comment_text}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-gray-500">No replies yet.</p>
          )}
        </div>

        <div>
          {issue.status === 'complete' && (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
              <p className="font-medium mb-1">ℹ️ Thread Complete</p>
              <p>This thread has been marked as complete, but you can still add comments or follow-up questions below.</p>
            </div>
          )}
          {issue.assigned_team_id !== user.team_id && issue.status !== 'complete' && (
            <div className="mb-3 p-3 bg-kra-red-50 border border-kra-red-200 rounded text-sm text-kra-red-800">
              <p className="font-medium mb-1">💡 Optional Contribution</p>
              <p>
                This thread is assigned to <strong>{issue.assigned_team_name}</strong>. 
                You can optionally contribute by sharing your insights below. 
                Your contribution will be visible to everyone and may help resolve the issue faster.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              placeholder={issue.status === 'complete' ? "Add a follow-up comment or question..." : (issue.assigned_team_id !== user.team_id ? "Share your insights (optional)..." : "Add your reply...")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 mb-2"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Posting...' : issue.status === 'complete' ? 'Add Comment' : (issue.assigned_team_id !== user.team_id ? 'Contribute (Optional)' : 'Reply')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataScienceThreadDetail;

