import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { User, Lock, Globe, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    department: user?.department || 'Computer Science & Engineering',
    student_id: user?.student_id || '',
    preferred_language: user?.preferred_language || 'en',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const data = await authService.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(passwordForm.old_password, passwordForm.new_password);
      toast.success('Password changed successfully.');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#E7DAD1]/10 pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#EA7957]/15 text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957]" />
          <span>User Preferences</span>
          <span>//</span>
          <span>Security &amp; Language</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-1.5">
          Account Settings
        </h1>
        <p className="text-xs text-[#D4C2B8] mt-0.5">
          Configure profile details, multi-language synthesis adaptation, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/10 p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E7DAD1]/10">
            <User className="w-4 h-4 text-[#EA7957]" />
            <h2 className="font-bold text-sm text-[#FBF8F5] font-heading">
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                Student ID
              </label>
              <input
                type="text"
                value={profileForm.student_id}
                onChange={(e) => setProfileForm({ ...profileForm, student_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                Department
              </label>
              <input
                type="text"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                Language Preference
              </label>
              <select
                value={profileForm.preferred_language}
                onChange={(e) => setProfileForm({ ...profileForm, preferred_language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner cursor-pointer"
              >
                <option value="en">English (Default)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold shadow-lg shadow-[#EA7957]/25 transition-all mt-2 cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Password Security */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/10 p-6 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E7DAD1]/10">
            <Lock className="w-4 h-4 text-[#EA7957]" />
            <h2 className="font-bold text-sm text-[#FBF8F5] font-heading">
              Update Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                New Password (Min 8 Chars)
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 uppercase">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#160D08]/85 backdrop-blur-md border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] focus:outline-none focus:border-[#EA7957]/70 shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold shadow-lg shadow-[#EA7957]/25 transition-all mt-4 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
