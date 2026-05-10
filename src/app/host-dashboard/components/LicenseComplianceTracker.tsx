'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, XCircle, Clock, FileText,
  RefreshCw, PlusCircle, CheckCircle2, Info, Building2,
  CalendarDays, Pencil, ExternalLink, ShieldAlert, Zap,
} from 'lucide-react';

interface LicenseComplianceTrackerProps {
  properties?: Property[];
}

// One row per document type per property
interface DocEntry {
  propertyId: string;
  propertyName: string;
  docType: string;
  docLabel: string;
  docUrl: string | undefined;
  // From licenses table (if set)
  licenseId?: string;
  licenseNumber?: string;
  expiryDate?: string;   // ISO string
  daysLeft?: number;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'No Expiry Set' | 'Missing Document';
}

const DOC_TYPES: { key: keyof Property; label: string }[] = [
  { key: 'license_url',      label: 'Property License' },
  { key: 'tax_bill_url',     label: 'Tax Bill' },
  { key: 'current_bill_url', label: 'Current Bill' },
  { key: 'aadhar_url',       label: 'Aadhaar Card' },
  { key: 'pan_url',          label: 'PAN Card' },
  { key: 'noc_url',          label: 'NOC Document' },
];

function getDaysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function calcStatus(daysLeft: number): 'Active' | 'Expiring Soon' | 'Expired' {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 30) return 'Expiring Soon';
  return 'Active';
}

const CFG = {
  Active:             { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', bar: 'bg-emerald-500', Icon: CheckCircle2 },
  'Expiring Soon':    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25',   bar: 'bg-amber-500',   Icon: AlertTriangle },
  Expired:            { bg: 'bg-red-500/10',      text: 'text-red-400',     border: 'border-red-500/25',     bar: 'bg-red-500',     Icon: XCircle },
  'No Expiry Set':    { bg: 'bg-zinc-800/60',     text: 'text-zinc-400',    border: 'border-zinc-700',       bar: 'bg-zinc-600',    Icon: Clock },
  'Missing Document': { bg: 'bg-zinc-900/60',     text: 'text-zinc-600',    border: 'border-zinc-800',       bar: 'bg-zinc-800',    Icon: ShieldAlert },
};

export default function LicenseComplianceTracker({ properties = [] }: LicenseComplianceTrackerProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [licenseMap, setLicenseMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Modal state
  const [editEntry, setEditEntry] = useState<DocEntry | null>(null);
  const [formExpiry, setFormExpiry] = useState('');
  const [formLicNo, setFormLicNo] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Fetch licenses ──
  const fetchLicenses = async () => {
    if (!properties.length) { setLoading(false); return; }
    const ids = properties.map(p => p.id);
    const { data } = await supabase
      .from('licenses')
      .select('*')
      .in('property_id', ids);
    const map: Record<string, any[]> = {};
    (data || []).forEach(row => {
      if (!map[row.property_id]) map[row.property_id] = [];
      map[row.property_id].push(row);
    });
    setLicenseMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchLicenses(); }, [properties]);

  // ── Build rows ──
  const entries = useMemo<DocEntry[]>(() => {
    const rows: DocEntry[] = [];
    properties.forEach(prop => {
      const propLicenses = licenseMap[prop.id] || [];
      DOC_TYPES.forEach(({ key, label }) => {
        const url = prop[key] as string | undefined;
        if (!url) return; // skip missing docs entirely — only show if doc exists
        // Match license row by doc_type stored as license_number prefix or just first match
        const lic = propLicenses.find(l => l.doc_type === key || l.license_number?.startsWith(label));
        let status: DocEntry['status'] = 'No Expiry Set';
        let daysLeft: number | undefined;
        if (lic?.expiry_date) {
          daysLeft = getDaysLeft(lic.expiry_date);
          status = calcStatus(daysLeft);
        }
        rows.push({
          propertyId: prop.id,
          propertyName: prop.name || prop.title || 'Property',
          docType: key,
          docLabel: label,
          docUrl: url,
          licenseId: lic?.id,
          licenseNumber: lic?.license_number,
          expiryDate: lic?.expiry_date,
          daysLeft,
          status,
        });
      });
    });
    return rows;
  }, [properties, licenseMap]);

  const filtered = useMemo(() =>
    filter === 'all' ? entries : entries.filter(e => e.status === filter),
    [entries, filter]
  );

  const stats = useMemo(() => ({
    total:    entries.length,
    active:   entries.filter(e => e.status === 'Active').length,
    expiring: entries.filter(e => e.status === 'Expiring Soon').length,
    expired:  entries.filter(e => e.status === 'Expired').length,
    unset:    entries.filter(e => e.status === 'No Expiry Set').length,
  }), [entries]);

  // ── Save expiry ──
  const handleSave = async () => {
    if (!editEntry || !formExpiry) return;
    setSaving(true);
    try {
      const payload = {
        property_id: editEntry.propertyId,
        license_number: formLicNo || `${editEntry.docLabel} — ${editEntry.propertyName}`,
        doc_type: editEntry.docType,
        expiry_date: formExpiry,
        status: calcStatus(getDaysLeft(formExpiry)),
      };
      if (editEntry.licenseId) {
        await supabase.from('licenses').update(payload).eq('id', editEntry.licenseId);
      } else {
        await supabase.from('licenses').insert([payload]);
      }
      await fetchLicenses();
      setEditEntry(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="w-full h-80 flex items-center justify-center">
      <ShieldCheck size={32} className="text-indigo-400 animate-pulse" />
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0a0f]/80 p-6 md:p-8 rounded-[2rem] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.25)]">
            <ShieldCheck size={28} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">License & Compliance</h1>
            <p className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-indigo-400" /> Active Tracker — Document Expiry Monitor
            </p>
          </div>
        </div>
        <button onClick={() => { setLoading(true); fetchLicenses(); }}
          className="relative z-10 p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Docs', val: stats.total, color: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Active',     val: stats.active,   color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Expiring',   val: stats.expiring, color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
          { label: 'Expired',    val: stats.expired,  color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
          { label: 'No Expiry',  val: stats.unset,    color: 'text-zinc-400',    bg: 'bg-zinc-800/50',    border: 'border-zinc-700' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col gap-1`}>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'Active', 'Expiring Soon', 'Expired', 'No Expiry Set'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all
              ${filter === f ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-white/5 text-zinc-500 border-white/10 hover:text-zinc-300'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <ShieldCheck size={40} className="mb-3 opacity-30" />
            <p className="font-bold text-sm">No documents found for this filter.</p>
            {entries.length === 0 && <p className="text-xs mt-1">Upload documents when adding/editing a property.</p>}
          </div>
        ) : (
          filtered.map((entry, idx) => {
            const cfg = CFG[entry.status];
            const { Icon } = cfg;
            return (
              <motion.div key={`${entry.propertyId}-${entry.docType}`}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className={`${cfg.bg} border ${cfg.border} rounded-2xl p-5 relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.bar} opacity-50`} />

                <div className="flex items-start justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      <Icon size={16} className={cfg.text} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-sm">{entry.docLabel}</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <Building2 size={9} /> {entry.propertyName}
                      </p>
                    </div>
                  </div>

                  {/* Right badges + actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-widest ${cfg.text} bg-black/20`}>
                      {entry.status}
                    </span>

                    {/* View doc */}
                    <a href={entry.docUrl} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                      <ExternalLink size={13} />
                    </a>

                    {/* Set / Edit expiry */}
                    <button
                      onClick={() => {
                        setEditEntry(entry);
                        setFormExpiry(entry.expiryDate ? entry.expiryDate.slice(0, 10) : '');
                        setFormLicNo(entry.licenseNumber || '');
                      }}
                      className="px-3 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/25 transition-all flex items-center gap-1.5">
                      <Pencil size={11} />
                      {entry.expiryDate ? 'Edit Expiry' : 'Set Expiry'}
                    </button>
                  </div>
                </div>

                {/* Expiry info row */}
                {entry.expiryDate && (
                  <div className="mt-4 flex items-center gap-6 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Expires On</p>
                      <p className={`text-sm font-bold font-mono flex items-center gap-1 ${entry.status === 'Expired' ? 'text-red-400' : 'text-white'}`}>
                        <CalendarDays size={12} />
                        {new Date(entry.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {entry.daysLeft !== undefined && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Days Left</p>
                        <p className={`text-sm font-black ${entry.daysLeft < 0 ? 'text-red-400' : entry.daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {entry.daysLeft < 0 ? `${Math.abs(entry.daysLeft)}d overdue` : `${entry.daysLeft}d`}
                        </p>
                      </div>
                    )}
                    {entry.licenseNumber && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Reference No.</p>
                        <p className="text-xs font-bold font-mono text-zinc-300">{entry.licenseNumber}</p>
                      </div>
                    )}
                    {/* Progress bar */}
                    {entry.daysLeft !== undefined && entry.daysLeft >= 0 && (
                      <div className="flex-1">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (entry.daysLeft / 365) * 100)}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05 }}
                            className={`h-full rounded-full ${cfg.bar}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No expiry set hint */}
                {!entry.expiryDate && (
                  <div className="mt-3 flex items-center gap-2 text-zinc-600">
                    <Info size={12} />
                    <p className="text-[10px] font-bold">Click "Set Expiry" to start tracking this document's expiry date.</p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Set/Edit Expiry Modal */}
      <AnimatePresence>
        {editEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0f] border border-white/10 rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500 rounded-t-[2rem]" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                  <CalendarDays size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-white">{editEntry.expiryDate ? 'Edit Expiry Date' : 'Set Expiry Date'}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {editEntry.docLabel} — {editEntry.propertyName}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Reference / License Number</label>
                  <input type="text" value={formLicNo} onChange={e => setFormLicNo(e.target.value)}
                    placeholder="e.g. LIC-2024-XXXX (optional)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Expiry Date <span className="text-red-400">*</span></label>
                  <input type="date" value={formExpiry} onChange={e => setFormExpiry(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm font-medium [color-scheme:dark]" />
                </div>

                {formExpiry && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold
                    ${calcStatus(getDaysLeft(formExpiry)) === 'Active' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                    : calcStatus(getDaysLeft(formExpiry)) === 'Expiring Soon' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                    : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
                    <Info size={14} />
                    Status will be: {calcStatus(getDaysLeft(formExpiry))} ({getDaysLeft(formExpiry)} days left)
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditEntry(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!formExpiry || saving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={14} /> Save Expiry</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
