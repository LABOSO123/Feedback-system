import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const TeamsManagement = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    team_lead_user_id: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers();
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_URL}/teams`);
      setTeams(response.data.teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data.users.filter(u => u.role === 'data_science'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeamMembers = async () => {
    if (!selectedTeam) return;
    try {
      const response = await axios.get(`${API_URL}/teams/${selectedTeam}`);
      setTeamMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_URL}/teams/${editing}`, formData);
      } else {
        await axios.post(`${API_URL}/teams`, formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', team_lead_user_id: '' });
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save team');
    }
  };

  const handleEdit = (team) => {
    setEditing(team.id);
    setFormData({
      name: team.name,
      team_lead_user_id: team.team_lead_user_id || ''
    });
    setShowForm(true);
    setSelectedTeam(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/teams/${id}`);
      fetchTeams();
      if (selectedTeam === id) {
        setSelectedTeam(null);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete team');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/teams/${teamId}/members/${userId}`);
      fetchTeamMembers();
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleAssignTeamLead = async (teamId, userId) => {
    try {
      await axios.put(`${API_URL}/teams/${teamId}`, { team_lead_user_id: userId });
      fetchTeams();
      fetchTeamMembers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign team lead');
    }
  };

  const handleRevokeTeamLead = async (teamId) => {
    if (!window.confirm('Are you sure you want to revoke the team lead?')) {
      return;
    }
    try {
      await axios.patch(`${API_URL}/teams/${teamId}/revoke-lead`);
      fetchTeams();
      fetchTeamMembers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to revoke team lead');
    }
  };

  const handleAddMember = async (teamId, userId) => {
    try {
      await axios.post(`${API_URL}/teams/${teamId}/members`, { user_id: userId });
      fetchTeamMembers();
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const getAvailableUsers = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return users;
    return users.filter(u => u.team_id !== teamId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Teams Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', team_lead_user_id: '' });
            setSelectedTeam(null);
          }}
          className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
        >
          + Add Team
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Team' : 'Create Team'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Lead
                </label>
                <select
                  value={formData.team_lead_user_id}
                  onChange={(e) => setFormData({ ...formData, team_lead_user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                >
                  <option value="">No team lead</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
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
                    setFormData({ name: '', team_lead_user_id: '' });
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
        {/* Teams List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Teams</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedTeam === team.id ? 'bg-kra-red-50 border-l-4 border-kra-red-600' : ''
                }`}
                onClick={() => {
                  setSelectedTeam(team.id);
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{team.name}</h4>
                    <p className="text-sm text-gray-500">
                      Lead: {team.team_lead_name || 'None'} | Members: {team.member_count || 0}
                    </p>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-kra-red-600 hover:text-kra-red-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
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

        {/* Team Details */}
        {selectedTeam && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {teams.find(t => t.id === selectedTeam)?.name} - Members
              </h3>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Team Lead Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Team Lead</h4>
              {teams.find(t => t.id === selectedTeam)?.team_lead_user_id ? (
                <div className="flex items-center justify-between bg-kra-red-50 p-3 rounded border border-kra-red-200">
                  <span className="text-sm text-kra-black-900">
                    {teams.find(t => t.id === selectedTeam)?.team_lead_name}
                  </span>
                  <button
                    onClick={() => handleRevokeTeamLead(selectedTeam)}
                    className="text-kra-red-600 hover:text-kra-red-700 text-sm font-medium"
                  >
                    Revoke
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No team lead assigned</p>
              )}
            </div>

            {/* Members List */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Members</h4>
              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500">No members in this team</p>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        {teams.find(t => t.id === selectedTeam)?.team_lead_user_id !== member.id && (
                          <button
                            onClick={() => handleAssignTeamLead(selectedTeam, member.id)}
                            className="text-xs text-kra-red-600 hover:text-kra-red-700 font-medium"
                          >
                            Make Lead
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(selectedTeam, member.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Member */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Add Member</h4>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(selectedTeam, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500 text-sm"
              >
                <option value="">Select a user to add...</option>
                {getAvailableUsers(selectedTeam).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsManagement;
