import React, { useMemo } from 'react';
import { PropertyControlData, PropertyQualityScore, Property } from '@/lib/types';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface SmartEstateManagementProps {
  properties?: Property[];
}

const SmartEstateManagement: React.FC<SmartEstateManagementProps> = ({ properties: propData = [] }) => {
  const { controls, qualityScores } = useMemo(() => {
    const mappedControls: PropertyControlData[] = propData.map((p) => ({
      id: p.id,
      propertyName: p.name || p.title || 'Stay Cool Property',
      isBlocked: p.status === 'offline',
    }));

    const mappedScores: PropertyQualityScore[] = propData.map((p) => ({
      propertyId: p.id,
      propertyName: p.name || p.title || 'Stay Cool Property',
      score: Math.floor(Math.random() * 4) + 6, // 6 to 9 random score
      feedback: ['Description is accurate', 'Great response rate'],
    }));

    return { controls: mappedControls, qualityScores: mappedScores };
  }, [propData]);

  const handleToggleBlock = async (id: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'active' : 'offline';

    try {
      const { error } = await supabase
        .rpc('toggle_property_status', { p_id: id, p_status: newStatus });

      if (error) throw error;
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Smart Estate</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
            Inventory Management System
          </p>
        </div>
        <div className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">
            Total Units: {propData.length}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-3xl">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-4">
            Master Switches
          </h2>
          <div className="space-y-4">
            {controls.map((control) => (
              <div
                key={control.id}
                className="p-5 border border-white/5 rounded-2xl bg-white/[0.01] flex justify-between items-center group hover:bg-white/[0.03] transition-all"
              >
                <div>
                  <p className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {control.propertyName}
                  </p>
                  <p
                    className={`text-[9px] font-black uppercase mt-1 tracking-tighter ${control.isBlocked ? 'text-red-500' : 'text-green-500'}`}
                  >
                    {control.isBlocked ? 'Status: Off-Market' : 'Status: Live'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={control.isBlocked}
                    onChange={() => handleToggleBlock(control.id, control.isBlocked)}
                  />
                  <div className="w-11 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-6"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-3xl">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-8 border-b border-white/5 pb-4">
            Quality Metrics
          </h2>
          <div className="space-y-6">
            {qualityScores.map((quality) => (
              <div
                key={quality.propertyId}
                className="p-6 rounded-3xl bg-white/[0.01] border border-white/5"
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="font-bold text-white text-sm">{quality.propertyName}</p>
                  <span className="text-xs font-black px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md">
                    {quality.score}/10
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${quality.score * 10}%` }}
                    className={`h-full ${quality.score >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {quality.feedback.map((f, i) => (
                    <span
                      key={i}
                      className="text-[9px] text-zinc-600 bg-white/5 px-2 py-1 rounded-md"
                    >
                      # {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartEstateManagement;

