import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  UserCheck,
  Edit2,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Edit user modal
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('student');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await adminService.getUsers(params);
      setUsers(data.results || data || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleOpenEdit = (u) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditIsActive(u.is_active);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    try {
      await adminService.updateUser(editUser.id, {
        role: editRole,
        is_active: editIsActive,
      });
      toast.success('User privileges updated.');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] animate-pulse" />
            <span>Access Control</span>
            <span>//</span>
            <span>RBAC Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-2">
            User &amp; Role Directory
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-1">
            Manage authenticated student identities, staff privileges, and account states.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D4C2B8]/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#20140E]/80 backdrop-blur-xl border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#20140E]/80 backdrop-blur-xl border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
        >
          <option value="" className="bg-[#1E120D]">All Account Roles</option>
          <option value="student" className="bg-[#1E120D]">Student</option>
          <option value="admin" className="bg-[#1E120D]">Administrator</option>
          <option value="faculty" className="bg-[#1E120D]">Faculty</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#20140E]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/12 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2A1B14]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#D4C2B8] font-mono uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#D4C2B8]/70 font-mono">Loading user directory...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#D4C2B8]/70 font-mono">No registered users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#2A1B14]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#FBF8F5]">
                      <div>{u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username}</div>
                      <span className="block text-[10px] text-[#D4C2B8]/70 font-mono mt-0.5">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#76C893]/15 text-[#76C893] border border-[#76C893]/30">
                          STUDENT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]">{u.department || 'General'}</td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#76C893]">
                          <CheckCircle2 className="w-3 h-3 text-[#76C893]" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#EA7957]">
                          <XCircle className="w-3 h-3 text-[#EA7957]" /> INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]/70 font-mono">
                      {new Date(u.date_joined || u.created_at || Date.now()).toLocaleDateString().toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#2E1E17]/80 border border-[#E7DAD1]/14 hover:border-[#EA7957]/50 text-[#D4C2B8] hover:text-[#FBF8F5] transition-colors cursor-pointer"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1E120D]/95 backdrop-blur-2xl rounded-2xl max-w-md w-full border border-[#E7DAD1]/16 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DAD1]/10">
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Modify User Privileges
              </h3>
              <button onClick={() => setEditUser(null)} className="text-[#D4C2B8]/70 hover:text-[#FBF8F5] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-[#A89284] block mb-1">USER IDENTITY</span>
                <p className="p-3 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/12 text-xs font-mono text-[#FBF8F5] shadow-inner">
                  {editUser.username} ({editUser.email})
                </p>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Assigned Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-mono text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
                >
                  <option value="student" className="bg-[#1E120D]">Student</option>
                  <option value="admin" className="bg-[#1E120D]">Administrator</option>
                  <option value="faculty" className="bg-[#1E120D]">Faculty</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Account State
                </label>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs font-mono text-[#FBF8F5] focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
                >
                  <option value="active" className="bg-[#1E120D]">Active (Granted Access)</option>
                  <option value="inactive" className="bg-[#1E120D]">Inactive / Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#E7DAD1]/14 text-xs font-mono uppercase text-[#D4C2B8] hover:text-[#FBF8F5] hover:bg-[#352219] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-semibold shadow-lg shadow-[#EA7957]/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Apply Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
