import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
  Users,
  Files,
  HelpCircle,
  ThumbsUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [ovData, qData] = await Promise.all([
          adminService.getOverviewAnalytics(),
          adminService.getQuestionsAnalytics(),
        ]);
        setOverview(ovData);
        setChartData(qData);
      } catch (err) {
        console.error("Failed to fetch admin analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse border border-[#E7DAD1] dark:border-[#443730]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-black/5 dark:bg-white/5 animate-pulse border border-[#E7DAD1] dark:border-[#443730]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-7 sm:p-8 rounded-2xl bg-[#241711]/75 backdrop-blur-2xl border border-[#E7DAD1]/12 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#EA7957]/15 text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957]" />
            <span>Governance &amp; Telemetry</span>
            <span>//</span>
            <span>Root Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FBF8F5] font-heading tracking-tight">
            Admin Intelligence Center
          </h1>
          <p className="text-xs sm:text-sm text-[#D4C2B8]">
            Realtime monitoring of institutional RAG accuracy, document chunk health, and student knowledge gaps.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/documents"
            className="px-4 py-2.5 rounded-xl bg-[#EA7957] hover:bg-[#df6a47] text-white text-xs font-mono uppercase font-bold flex items-center gap-2 shadow-lg shadow-[#EA7957]/25 transition-all"
          >
            <Files className="w-3.5 h-3.5 text-white" />
            <span>Manage Documents</span>
          </Link>
          <Link
            to="/admin/knowledge-gaps"
            className="px-4 py-2.5 rounded-xl border border-[#E7DAD1]/15 hover:border-[#EA7957]/50 bg-[#2A1A12]/80 backdrop-blur-md text-[#F5ECE5] text-xs font-mono uppercase font-semibold transition-all"
          >
            <span>Review Knowledge Gaps</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions Asked */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-5 border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-[#8C7669] text-[10px] font-mono uppercase tracking-wider font-semibold">
            <span>Total Queries</span>
            <div className="w-7 h-7 rounded-lg bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#EA7957] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#FBF8F5] font-heading">
            {overview?.questions?.total || 0}
          </p>
          <p className="text-xs text-[#8C7669] flex items-center gap-1.5 font-mono">
            <span className="text-[#76C893] font-bold">{overview?.questions?.support_rate}%</span>
            <span>GROUNDED RATE</span>
          </p>
        </div>

        {/* Indexed Knowledge Chunks */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-5 border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-[#8C7669] text-[10px] font-mono uppercase tracking-wider font-semibold">
            <span>Indexed Documents</span>
            <div className="w-7 h-7 rounded-lg bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#76C893] flex items-center justify-center shadow-xs">
              <Files className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#FBF8F5] font-heading">
            {overview?.documents?.total_documents || 0}
          </p>
          <p className="text-xs text-[#8C7669] flex items-center gap-1.5 font-mono">
            <span className="text-[#EA7957] font-bold">{overview?.documents?.total_chunks || 0}</span>
            <span>VECTOR CHUNKS ACTIVE</span>
          </p>
        </div>

        {/* Unresolved Knowledge Gaps */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-5 border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-[#8C7669] text-[10px] font-mono uppercase tracking-wider font-semibold">
            <span>Knowledge Gaps</span>
            <div className="w-7 h-7 rounded-lg bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#EA7957] flex items-center justify-center shadow-xs">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#EA7957] font-heading">
            {overview?.knowledge_gaps?.unresolved || 0}
          </p>
          <p className="text-xs text-[#8C7669] flex items-center gap-1.5 font-mono">
            <span>{overview?.knowledge_gaps?.total || 0} TOTAL QUERIES FLAGGED</span>
          </p>
        </div>

        {/* Positive Grounding Feedback */}
        <div className="bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-5 border border-[#E7DAD1]/10 shadow-sm space-y-2 hover:border-[#EA7957]/45 hover:bg-[#2A1C15]/80 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between text-[#8C7669] text-[10px] font-mono uppercase tracking-wider font-semibold">
            <span>Student Satisfaction</span>
            <div className="w-7 h-7 rounded-lg bg-[#2A1911]/80 border border-[#E7DAD1]/12 text-[#76C893] flex items-center justify-center shadow-xs">
              <ThumbsUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#FBF8F5] font-heading">
            {overview?.feedback?.satisfaction_rate}%
          </p>
          <p className="text-xs text-[#8C7669] flex items-center gap-1.5 font-mono">
            <span className="text-[#76C893] font-bold">{overview?.feedback?.helpful_count || 0}</span>
            <span>HELPFUL VERIFICATIONS</span>
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Inquiry Trajectory (AreaChart) */}
        <div className="lg:col-span-7 bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-6 border border-[#E7DAD1]/10 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Query Velocity (Last 14 Days)
              </h3>
              <p className="text-xs text-[#D4C2B8]">
                Frequency of student questions processed through RAG pipeline.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
              Live Flow
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.daily_questions || []}>
                <defs>
                  <linearGradient id="morpheusCoralGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA7957" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EA7957" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DAD1" opacity={0.15} />
                <XAxis dataKey="date" stroke="#8C7669" fontSize={10} tickLine={false} />
                <YAxis stroke="#8C7669" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E120D',
                    borderColor: 'rgba(231,218,209,0.2)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FBF8F5',
                    fontFamily: 'IBM Plex Mono, monospace',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#EA7957"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#morpheusCoralGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (BarChart) */}
        <div className="lg:col-span-5 bg-[#231711]/70 backdrop-blur-xl rounded-2xl p-6 border border-[#E7DAD1]/10 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#FBF8F5] font-heading">
                Domain Inquiries
              </h3>
              <p className="text-xs text-[#D4C2B8]">
                Top queried categories across the student population.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E3324]/80 text-[#76C893] border border-[#76C893]/30">
              Categories
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.category_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7DAD1" opacity={0.15} />
                <XAxis dataKey="category" stroke="#8C7669" fontSize={10} tickLine={false} />
                <YAxis stroke="#8C7669" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E120D',
                    borderColor: 'rgba(231,218,209,0.2)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#FBF8F5',
                    fontFamily: 'IBM Plex Mono, monospace',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                />
                <Bar dataKey="count" fill="#EA7957" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
