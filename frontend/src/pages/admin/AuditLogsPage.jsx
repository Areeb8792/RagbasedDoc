import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { ShieldCheck, Search, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (actionFilter) params.action = actionFilter;
        const data = await adminService.getAuditLogs(params);
        setLogs(data.results || data || []);
      } catch (err) {
        toast.error('Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [search, actionFilter]);

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7DAD1]/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EA7957]/15 backdrop-blur-md text-[#EA7957] text-[10px] font-mono font-medium border border-[#EA7957]/30 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA7957] animate-pulse" />
            <span>Audit Trail</span>
            <span>//</span>
            <span>Immutable Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FBF8F5] font-heading mt-2">
            Security &amp; Audit Logs
          </h1>
          <p className="text-xs text-[#D4C2B8] mt-1">
            Immutable audit trails of institutional document uploads, deletions, policy changes, and user access.
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
            placeholder="Search by actor email, action, or target ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#20140E]/80 backdrop-blur-xl border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/70 focus:outline-none shadow-inner"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#20140E]/80 backdrop-blur-xl border border-[#E7DAD1]/14 text-xs text-[#FBF8F5] font-mono focus:border-[#EA7957]/70 focus:outline-none shadow-inner cursor-pointer"
        >
          <option value="" className="bg-[#20140E]">All Audited Actions</option>
          <option value="document_uploaded" className="bg-[#20140E]">document_uploaded</option>
          <option value="document_indexed" className="bg-[#20140E]">document_indexed</option>
          <option value="document_reprocessed" className="bg-[#20140E]">document_reprocessed</option>
          <option value="document_deleted" className="bg-[#20140E]">document_deleted</option>
          <option value="faq_created" className="bg-[#20140E]">faq_created</option>
          <option value="user_registered" className="bg-[#20140E]">user_registered</option>
          <option value="user_logged_in" className="bg-[#20140E]">user_logged_in</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#20140E]/70 backdrop-blur-xl rounded-2xl border border-[#E7DAD1]/12 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#2A1B14]/80 backdrop-blur-md border-b border-[#E7DAD1]/10 text-[#D4C2B8] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DAD1]/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#D4C2B8]/70">Loading audit ledger...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#D4C2B8]/70">No audit events recorded.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#2A1B14]/60 transition-colors">
                    <td className="py-3.5 px-4 text-[#D4C2B8]/70">
                      {new Date(log.timestamp || log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#FBF8F5]">
                      {log.actor_email || log.actor_username || 'System Daemon'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EA7957]/15 text-[#EA7957] border border-[#EA7957]/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]">{log.target_type || 'Internal'}</td>
                    <td className="py-3.5 px-4 text-[#D4C2B8]/70 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
