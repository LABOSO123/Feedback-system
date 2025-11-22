import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'business',
    team_id: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleAssignTeam = async (userId, teamId) => {
    try {
      await axios.post(`${API_URL}/teams/${teamId}/members`, { user_id: userId });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign team');
    }
  };

  const handleRemoveFromTeam = async (userId, teamId) => {
    try {
      await axios.delete(`${API_URL}/teams/${teamId}/members/${userId}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove from team');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const { password, ...userData } = newUserData;
      // Create user via admin endpoint (we'll need to add this)
      await axios.post(`${API_URL}/admin/users`, {
        ...newUserData,
        password // Include password for new user creation
      });
      setShowAddUserForm(false);
      setNewUserData({ name: '', email: '', password: '', role: 'business', team_id: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleMakeTeamLead = async (userId, teamId) => {
    try {
      await axios.put(`${API_URL}/teams/${teamId}`, { team_lead_user_id: userId });
      fetchUsers();
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
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to revoke team lead');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-kra-black-900 text-white';
      case 'data_science':
        return 'bg-kra-red-100 text-kra-red-800 border border-kra-red-200';
      case 'business':
        return 'bg-kra-red-50 text-kra-red-800 border border-kra-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Users Management</h2>
        <button
          onClick={() => {
            setShowAddUserForm(true);
            setNewUserData({ name: '', email: '', password: '', role: 'business', team_id: '' });
          }}
          className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
        >
          + Add User
        </button>
      </div>

      {showAddUserForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                  placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value, team_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                >
                  <option value="business">Business</option>
                  <option value="data_science">Data Science</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUserData.role === 'data_science' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Team (Optional)</label>
                  <select
                    value={newUserData.team_id}
                    onChange={(e) => setNewUserData({ ...newUserData, team_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                  >
                    <option value="">No team (assign later)</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                type="submit"
                className="bg-kra-red-600 text-white px-4 py-2 rounded-md hover:bg-kra-red-700 font-medium"
              >
                Create User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserForm(false);
                  setNewUserData({ name: '', email: '', password: '', role: 'business', team_id: '' });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.role === 'data_science' ? (
                    <select
                      value={user.team_id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignTeam(user.id, e.target.value);
                        } else if (user.team_id) {
                          handleRemoveFromTeam(user.id, user.team_id);
                        }
                      }}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-kra-red-500 focus:border-kra-red-500"
                    >
                      <option value="">No team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500">-</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.role === 'data_science' && user.team_id && (
                    <div className="flex flex-col items-end space-y-1">
                      {teams.find(t => t.id === user.team_id)?.team_lead_user_id === user.id ? (
                        <button
                          onClick={() => handleRevokeTeamLead(user.team_id)}
                          className="text-kra-red-600 hover:text-kra-red-700 font-medium"
                        >
                          Revoke Lead
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMakeTeamLead(user.id, user.team_id)}
                          className="text-kra-red-600 hover:text-kra-red-700 font-medium"
                        >
                          Make Lead
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="text-red-600 hover:text-red-900 ml-3"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;

