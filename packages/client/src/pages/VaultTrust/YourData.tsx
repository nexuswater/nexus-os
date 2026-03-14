/**
 * Your Data — Connected providers, uploads, devices, permissions.
 * Full transparency and control over personal data.
 */
import { useState } from 'react';
import {
  Wifi, FileText, Cpu, Trash2, RefreshCcw, Shield,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';

interface Connection {
  id: string;
  provider: string;
  type: 'utility' | 'iot' | 'manual';
  status: 'active' | 'disconnected';
  lastSync: string;
  dataTypes: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  uploaded: string;
  verified: boolean;
}

const connections: Connection[] = [
  {
    id: 'c1', provider: 'City Water Authority', type: 'utility', status: 'active',
    lastSync: 'Today at 9:14 AM', dataTypes: ['Water bills', 'Usage history'],
  },
  {
    id: 'c2', provider: 'PowerCo Energy', type: 'utility', status: 'active',
    lastSync: 'Yesterday at 3:22 PM', dataTypes: ['Energy bills', 'Rate plan'],
  },
  {
    id: 'c3', provider: 'Nexus Smart Meter', type: 'iot', status: 'active',
    lastSync: '5 minutes ago', dataTypes: ['Real-time readings', 'Leak detection'],
  },
];

const uploadedFiles: UploadedFile[] = [
  { id: 'f1', name: 'Water_Bill_March_2026.pdf', type: 'PDF', uploaded: 'Mar 1, 2026', verified: true },
  { id: 'f2', name: 'Energy_Bill_Feb_2026.pdf', type: 'PDF', uploaded: 'Feb 27, 2026', verified: true },
  { id: 'f3', name: 'Water_Bill_Feb_2026.pdf', type: 'PDF', uploaded: 'Feb 1, 2026', verified: true },
  { id: 'f4', name: 'Energy_Bill_Jan_2026.pdf', type: 'PDF', uploaded: 'Jan 30, 2026', verified: true },
];

const permissions = [
  { id: 'p1', label: 'Share anonymized usage data for regional benchmarks', enabled: true },
  { id: 'p2', label: 'Allow IoT device auto-sync', enabled: true },
  { id: 'p3', label: 'Include profile in community leaderboard', enabled: false },
  { id: 'p4', label: 'Receive improvement recommendations', enabled: true },
];

export default function YourData() {
  const [perms, setPerms] = useState(permissions);

  const togglePerm = (id: string) => {
    setPerms(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="space-y-6">
      {/* Connected Providers */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Wifi size={14} className="text-[#00b8f0]" />
          Connected Providers
        </h3>
        <div className="space-y-2">
          {connections.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                c.type === 'iot' ? 'bg-[#25D695]/10' : 'bg-[#00b8f0]/10'
              }`}>
                {c.type === 'iot' ? (
                  <Cpu size={16} className="text-[#25D695]" />
                ) : (
                  <FileText size={16} className="text-[#00b8f0]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/90">{c.provider}</div>
                <div className="text-[10px] text-[#475569]">
                  Last sync: {c.lastSync} · {c.dataTypes.join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  c.status === 'active'
                    ? 'bg-[#25D695]/15 text-[#25D695]'
                    : 'bg-[#EF4444]/15 text-[#EF4444]'
                }`}>
                  {c.status === 'active' ? 'Active' : 'Disconnected'}
                </span>
                <button className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded Files */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={14} className="text-[#f99d07]" />
          Uploaded Files
        </h3>
        <div className="space-y-2">
          {uploadedFiles.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
              <FileText size={16} className="text-[#64748B] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 truncate">{f.name}</div>
                <div className="text-[10px] text-[#475569]">{f.uploaded}</div>
              </div>
              {f.verified && (
                <CheckCircle2 size={14} className="text-[#25D695] shrink-0" />
              )}
              <button className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={14} className="text-[#A78BFA]" />
          Permissions
        </h3>
        <div className="space-y-3">
          {perms.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
              <span className="text-sm text-white/80 flex-1 mr-3">{p.label}</span>
              <button
                onClick={() => togglePerm(p.id)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  p.enabled ? 'bg-[#25D695]' : 'bg-white/[0.15]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    p.enabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Export all data */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Export All Your Data</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Download everything we have on file for you</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-white/80 hover:bg-white/[0.1] transition-colors">
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
