import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}!`);

      if (data.user.role === 'admin' || data.user.role === 'superadmin' || data.user.is_staff) {
        navigate('/admin');
      } else {
        const destination = location.state?.from?.pathname;
        navigate(destination && destination !== '/student' && destination !== '/student/' ? destination : '/student/chat');
      }
    } catch (err) {
      const errorDetail = err.response?.data?.error?.details?.detail ||
                          err.response?.data?.error?.message ||
                          'Invalid username or password.';
      toast.error(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('AdminPass123!');
    } else {
      setUsername('student');
      setPassword('StudentPass123!');
    }
  };

  return (
    <div className="min-h-screen bg-[#18100C] text-[#FBF8F5] flex flex-col justify-between relative overflow-x-hidden font-sans">
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

      {/* Top Header */}
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

      {/* Main Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="bg-[#20140E]/80 backdrop-blur-2xl rounded-2xl max-w-md w-full border border-[#E7DAD1]/14 shadow-2xl p-8 sm:p-9 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-semibold uppercase tracking-wider border border-[#EA7957]/30">
              <span>Verified Campus Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading">
              Sign In to Morpheus
            </h1>
            <p className="text-xs text-[#D4C2B8]">
              Access institutional policies, attendance regulations, and academic bylaws.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1.5 font-medium uppercase tracking-wider">
                Username or Institutional Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student or admin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all placeholder-[#D4C2B8]/40"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#D4C2B8] block mb-1.5 font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DAD1]/14 bg-[#160D08]/85 backdrop-blur-md text-[#FBF8F5] text-sm focus:outline-none focus:border-[#EA7957]/70 shadow-inner transition-all pr-10 placeholder-[#D4C2B8]/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4C2B8]/60 hover:text-[#FBF8F5] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-[#E7DAD1]/10">
            <div className="text-[10px] font-mono uppercase text-[#A89284] text-center mb-2.5">
              Quick Demo Fill
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student')}
                className="px-3 py-2 rounded-xl bg-[#2A1B14]/80 hover:bg-[#38241B] text-[#76C893] border border-[#76C893]/30 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Demo Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="px-3 py-2 rounded-xl bg-[#2A1B14]/80 hover:bg-[#38241B] text-[#EA7957] border border-[#EA7957]/30 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-[#D4C2B8]">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#EA7957] hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-xs text-[#A89284] relative z-10 font-mono">
        MORPHEUS KNOWLEDGE ARCHITECTURE // VERIFIED SECURE
      </div>
    </div>
  );
};
