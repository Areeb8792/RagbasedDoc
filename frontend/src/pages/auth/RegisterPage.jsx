import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    department: 'Computer Science & Engineering',
    student_id: '',
    preferred_language: 'en',
    theme_preference: 'system',
  });
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.details?.username?.[0] ||
        err.response?.data?.error?.details?.email?.[0] ||
        err.response?.data?.error?.message ||
        'Registration failed. Please check your details.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#18100C] text-[#FBF8F5] flex flex-col justify-between relative overflow-x-hidden font-sans py-6">
      {/* Ambient background lighting meshes for frosted glass refraction */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.14]"
          style={{ background: 'radial-gradient(circle, #EA7957 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -left-40 w-[650px] h-[650px] rounded-full blur-[150px] opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, #C26344 0%, transparent 70%)' }}
        />
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(234, 121, 87, 0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Header */}
      <div className="p-6 sm:p-8 flex items-center justify-between max-w-7xl w-full mx-auto relative z-10">
        <Link to="/" className="flex flex-col group">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-2xl tracking-tight text-[#FBF8F5] font-heading">
              MORPHEUS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#35251E] text-[#EA7957] border border-[#EA7957]/30">
              v2.4
            </span>
          </div>
          <div className="w-8 h-[3px] bg-[#EA7957] rounded-full mt-1 group-hover:w-12 transition-all duration-300" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-[#20140E]/80 backdrop-blur-2xl rounded-2xl max-w-xl w-full border border-[#E7DAD1]/14 shadow-2xl p-8 sm:p-9 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-semibold uppercase tracking-wider border border-[#EA7957]/30">
              <span>Student Registration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
              Create Student Account
            </h1>
            <p className="text-xs text-[#D4C2B8]">
              Register to interact with verified institutional knowledge, bylaws, and policies.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Maya"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="m_sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  Student ID
                </label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="STU-2024-001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                Institutional Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@college.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all cursor-pointer"
              >
                <option value="Computer Science & Engineering" className="bg-[#1E120D]">Computer Science & Engineering</option>
                <option value="Electronics & Communication" className="bg-[#1E120D]">Electronics & Communication</option>
                <option value="Mechanical Engineering" className="bg-[#1E120D]">Mechanical Engineering</option>
                <option value="Civil Engineering" className="bg-[#1E120D]">Civil Engineering</option>
                <option value="Information Technology" className="bg-[#1E120D]">Information Technology</option>
                <option value="Biotechnology" className="bg-[#1E120D]">Biotechnology</option>
                <option value="Management Studies" className="bg-[#1E120D]">Management Studies</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1 font-medium uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-[#D4C2B8]">
            Already enrolled?{' '}
            <Link to="/login" className="font-semibold text-[#EA7957] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 text-center text-xs text-[#A89284] relative z-10 font-mono">
        MORPHEUS KNOWLEDGE ARCHITECTURE // ACADEMIC VERIFICATION SYSTEM
      </div>
    </div>
  );
};
