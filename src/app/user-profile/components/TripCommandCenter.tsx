'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { Booking, Property, Dispute } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import Countdown from './Countdown';
import { toast } from 'sonner';

import { createDispute } from '@/lib/dispute-actions';

type TripCommandCenterProps = {
  activeBooking: (Booking & { properties: Partial<Property> }) | null;
};

const TripCommandCenter = ({ activeBooking }: TripCommandCenterProps) => {
  const [isDigitalKeyVisible, setDigitalKeyVisible] = useState(false);
  const [isReportIssueVisible, setReportIssueVisible] = useState(false);
  const [isDisputeVisible, setIsDisputeVisible] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  useEffect(() => {
    if (activeBooking && activeBooking.status === 'checked_in') {
      const code = activeBooking.id.replace(/-/g, '').slice(0, 6).toUpperCase();
      setAccessCode(code);
    } else {
      setAccessCode(null);
    }
  }, [activeBooking]);

  // Form State for reporting issue
  const [issueText, setIssueText] = useState('');
  const [issuePriority, setIssuePriority] = useState('Low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedIssues, setReportedIssues] = useState<any[]>([]);
  const [filedDisputes, setFiledDisputes] = useState<Dispute[]>([]);

  // Dispute Form State
  const [disputeIssueType, setDisputeIssueType] = useState('Property not as described');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePriority, setDisputePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const guestName = activeBooking?.guest?.name || 'Guest';

  const fetchReportedIssues = async () => {
    if (!activeBooking) return;
    try {
      const { data, error } = await supabase
        .from('maintenance_alerts')
        .select('*')
        .eq('property_id', activeBooking.property_id)
        .eq('reported_by', guestName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReportedIssues(data);
    } catch (error) {
      console.error("Failed to fetch reported issues:", error);
    }
  };

  const fetchDisputes = async () => {
    if (!activeBooking) return;
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('booking_id', activeBooking.id)
        .order('createdDate', { ascending: false });

      if (error) throw error;
      if (data) setFiledDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
    }
  };

  useEffect(() => {
    fetchReportedIssues();
    fetchDisputes();
  }, [activeBooking]);

  const isCheckInAvailable = activeBooking
    ? new Date(activeBooking.check_in).getTime() <= Date.now()
    : false;

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking || !issueText.trim()) return;

    try {
      setIsSubmitting(true);

      const newAlert = {
        property_id: activeBooking.property_id,
        issue: issueText,
        reported_by: guestName,
        reported_date: new Date().toISOString(),
        status: 'New',
        priority: issuePriority,
      };

      const { error } = await supabase
        .from('maintenance_alerts')
        .insert([newAlert]);

      if (error) {
        console.error("DB Insert Error for maintenance_alerts:", error);
        throw new Error('An unexpected error occurred. Please try again later.');
      }

      toast.success("Issue reported successfully. The host and admin have been notified.");
      setReportIssueVisible(false);
      setIssueText('');
      setIssuePriority('Low');
      fetchReportedIssues();
    } catch (error: any) {
      console.error("Failed to report issue:", error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeBooking) {
    return (
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center h-full">
        <Icon name="LuggageIcon" className="w-12 h-12 text-zinc-500 mb-4" />
        <h3 className="font-bold text-lg text-zinc-100">No Active Trips</h3>
        <p className="text-sm text-zinc-400">Your next adventure will appear here.</p>
      </div>
    );
  }

  const { properties, check_in } = activeBooking;
  const property = properties;

  const handleNavigation = () => {
    // 1. Prioritize scrolling to the Location Map section if it exists on the page
    const mapSection = document.getElementById('location-map-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Fallback: Open Google Maps directly if the section is not found
    const destAddress = property?.address_line1 
      ? `${property.address_line1}, ${property.city || ''}, ${property.state || ''} ${property.postal_code || ''}`.trim()
      : property?.location || '';
    
    const destination = encodeURIComponent(destAddress);
    
    if (typeof window !== 'undefined' && "geolocation" in navigator) {
      toast.info("Accessing your location for precise navigation...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const origin = `${latitude},${longitude}`;
          // Use Google Maps Directions URL for real-time routing
          const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
          window.open(navUrl, '_blank');
        },
        (error) => {
          console.warn("Geolocation failed or denied, falling back to search:", error);
          const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
          window.open(fallbackUrl, '_blank');
          if (error.code === 1) {
            toast.error("Location access denied. Opening address search instead.");
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      // Fallback if browser doesn't support geolocation
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      window.open(fallbackUrl, '_blank');
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] shadow-xl overflow-hidden shadow-sky-900/5">
      <div
        className="p-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${property?.images?.[0] || ''})` }}
      >
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-6 border border-zinc-700/30">
          <h2 className="text-xs font-semibold uppercase text-sky-400 tracking-widest mb-2">
            Trip Command Center
          </h2>
          <h3 className="text-3xl font-bold text-white mb-2">{property?.title}</h3>
          <p className="text-sm text-zinc-200/80 flex items-center gap-2">
            <Icon name="MapPinIcon" size={14} className="text-sky-400" />
            {property?.location}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Live Countdown */}
        <div className="text-center">
          <p className="text-sm text-sky-300 font-medium mb-2 tracking-wide uppercase text-[10px]">Countdown to Arrival</p>
          <Countdown targetDate={check_in} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNavigation}
            className="w-full bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-xl px-4 py-4 flex items-center justify-center gap-2 transition-all hover:bg-sky-500/20 hover:border-sky-500/40"
          >
            <Icon name="NavigationIcon" size={18} />
            <span className="font-semibold text-sm">Navigation</span>
          </motion.button>

          {activeBooking.status === 'checked_in' ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDigitalKeyVisible(true)}
              className="w-full rounded-xl px-4 py-4 flex items-center justify-center gap-2 transition-all border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40"
            >
              <Icon name="KeyIcon" size={18} />
              <span className="font-semibold text-sm">Digital Key</span>
            </motion.button>
          ) : (
            <motion.button
              disabled={true}
              className="w-full rounded-xl px-4 py-4 flex items-center justify-center gap-2 transition-all border bg-zinc-800/40 text-zinc-500 border-zinc-700/50 cursor-not-allowed"
            >
              <Icon name="KeyIcon" size={18} />
              <span className="font-semibold text-sm">Locked until check-in</span>
            </motion.button>
          )}
        </div>

        {/* Report Issue Button - Restored and unconditionally visible per earlier fix! */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setReportIssueVisible(true)}
          className="w-full mt-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all hover:bg-red-500/20 hover:border-red-500/40"
        >
          <Icon name="ExclamationTriangleIcon" size={16} />
          <span className="font-semibold text-sm">Report Issue / Request Maintenance</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDisputeVisible(true)}
          className="w-full mt-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all hover:bg-amber-500/20 hover:border-amber-500/40"
        >
          <Icon name="ScaleIcon" size={16} />
          <span className="font-semibold text-sm">Dispute This Stay</span>
        </motion.button>

        {/* Display Reported Issues */}
        {reportedIssues.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase mb-3 px-2">Your Reported Issues</h4>
            <div className="space-y-3">
              {reportedIssues.map((issue) => (
                <div key={issue.id} className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-medium text-zinc-200 text-sm whitespace-pre-wrap">{issue.issue}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${issue.status === 'Completed' || issue.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      issue.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-zinc-500">Reported on {new Date(issue.reported_date).toLocaleDateString()}</span>
                    <span className={`text-[10px] font-bold uppercase ${issue.priority === 'Urgent' ? 'text-red-400' :
                      issue.priority === 'High' ? 'text-orange-400' :
                        issue.priority === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                      }`}>
                      {issue.priority} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display Filed Disputes */}
        {filedDisputes.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold tracking-wider text-amber-500/80 uppercase mb-3 px-2 flex items-center gap-2">
              <Icon name="ScaleIcon" size={14} /> Active Disputes
            </h4>
            <div className="space-y-3">
              {filedDisputes.map((dispute) => {
                const guestDescription = (dispute.description || '').split(' ||| ')[0];
                const hostResponse = (dispute.description || '').split(' ||| ')[1];

                return (
                  <div key={dispute.id} className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-amber-400">{dispute.caseNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${dispute.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            dispute.status === 'in_progress' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                              dispute.status === 'closed' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                            {dispute.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-medium text-zinc-200 text-sm">{dispute.issueType}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase mt-1 ${dispute.priority === 'critical' ? 'text-red-400' :
                        dispute.priority === 'high' ? 'text-orange-400' :
                          dispute.priority === 'medium' ? 'text-yellow-400' :
                            'text-green-400'
                        }`}>
                        {dispute.priority} Priority
                      </span>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3 text-sm text-zinc-300 italic border border-white/5">
                      "{guestDescription}"
                    </div>

                    {hostResponse && (
                      <div className="mt-2 pl-3 border-l-2 border-sky-500/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-400/70 mb-1">Host Response</p>
                        <p className="text-sm text-zinc-300">{hostResponse}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
                      <span>Filed on {new Date(dispute.createdDate).toLocaleDateString()}</span>
                      <span>Updated {new Date(dispute.lastUpdate || dispute.createdDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Digital Key Modal */}
      {isDigitalKeyVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50"
          onClick={() => setDigitalKeyVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-950 border border-sky-500/30 rounded-2xl p-8 max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="KeyIcon" className="w-16 h-16 mx-auto text-sky-500 animate-pulse" />
            <h3 className="text-2xl font-bold mt-4 text-white">Your Access Code</h3>
            <p className="text-zinc-400 mt-2">
              Use this code to unlock your smart lock upon arrival.
            </p>
            <div className="my-6 bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg py-4">
              <p className="text-4xl font-mono tracking-widest text-emerald-400">{accessCode}</p>
            </div>
            <button
              onClick={() => setDigitalKeyVisible(false)}
              className="w-full bg-primary/20 text-primary border border-primary/50 rounded-lg py-2 font-semibold transition-colors hover:bg-primary/30"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Report Issue Modal */}
      {isReportIssueVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4"
          onClick={() => setReportIssueVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-950 border border-red-500/30 rounded-2xl p-6 w-full max-w-md text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Icon name="ExclamationTriangleIcon" className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Report an Issue</h3>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Please describe the issue you are facing. Your host and the property managers will be notified immediately.
            </p>

            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Issue Description</label>
                <textarea
                  required
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="e.g. The AC in the master bedroom is not cooling."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Priority Level</label>
                <select
                  value={issuePriority}
                  onChange={(e) => setIssuePriority(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                >
                  <option value="Low">Low - Not urgent, but needs attention</option>
                  <option value="Medium">Medium - Affecting my stay</option>
                  <option value="High">High - Significant issue</option>
                  <option value="Urgent">Urgent - Safety or critical functionality</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setReportIssueVisible(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !issueText.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Dispute Modal */}
      {isDisputeVisible && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4"
          onClick={() => setIsDisputeVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-6 w-full max-w-md text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-full">
                <Icon name="ScaleIcon" className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white">File a Dispute</h3>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Feeling that something went wrong with your stay? File a dispute and our support team will review the case.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!activeBooking) return;
                setIsSubmitting(true);
                const res = await createDispute({
                  booking_id: activeBooking.id,
                  guest_id: activeBooking.guest_id,
                  host_id: activeBooking.properties?.host_id || '',
                  property_id: activeBooking.property_id,
                  guestName: guestName,
                  hostName: activeBooking.properties?.host?.name || 'Host',
                  propertyName: property?.title || 'Property',
                  issueType: disputeIssueType,
                  description: disputeDescription,
                  priority: disputePriority,
                });

                if (res.success) {
                  toast.success("Dispute filed successfully. Our team will contact you soon.");
                  setIsDisputeVisible(false);
                  setDisputeDescription('');
                  fetchDisputes(); // Refresh the list
                } else {
                  toast.error("Failed to file dispute: " + res.error);
                }
                setIsSubmitting(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Issue Category</label>
                <select
                  value={disputeIssueType}
                  onChange={(e) => setDisputeIssueType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                >
                  <option value="Property not as described">Property not as described</option>
                  <option value="Cleanliness issues">Cleanliness issues</option>
                  <option value="Safety concerns">Safety concerns</option>
                  <option value="Host behavior">Host behavior</option>
                  <option value="Billing discrepancy">Billing discrepancy</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  required
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Tell us what happened in detail..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">How urgent is this?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDisputePriority(p)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${disputePriority === p
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDisputeVisible(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !disputeDescription.trim()}
                  className="px-6 py-2 bg-amber-600 text-black rounded-lg font-bold hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  {isSubmitting ? 'Filing...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TripCommandCenter;
