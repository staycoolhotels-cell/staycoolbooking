'use client';

import React from 'react';
import { Transaction } from '@/lib/types';

type RealTimeInvoiceProps = {
  transaction: Transaction;
  onClose?: () => void;
};

const RealTimeInvoice = ({ transaction, onClose }: RealTimeInvoiceProps) => {
  const isRefund = transaction.type === 'refund';
  const invoiceId = transaction.invoice_id || (transaction.id ? transaction.id.split('-')[0].toUpperCase() : 'N/A');
  const date = transaction.date || new Date().toLocaleDateString();

  const breakdown = transaction.breakdown || {
    accommodation: transaction.amount || 0,
    service_fee: 0,
    taxes: 0,
    discount: 0,
    upgrades: 0,
    cancellation_fee: 0
  };

  const originalTotal = transaction.amount || 0;
  const netRefundablePool = transaction.netRefundablePool !== undefined 
    ? transaction.netRefundablePool 
    : (breakdown.accommodation || Math.round(originalTotal / 1.1));
  const refundPercent = transaction.refundPercentage !== undefined 
    ? transaction.refundPercentage 
    : (netRefundablePool > 0 && transaction.refundAmount !== undefined ? Math.round((transaction.refundAmount / netRefundablePool) * 100) : 50);
  const eligibleRefund = Math.round((netRefundablePool * refundPercent) / 100);
  const retainedPenalty = transaction.retainedPenalty !== undefined 
    ? transaction.retainedPenalty 
    : Math.max(0, netRefundablePool - eligibleRefund);
  const retainedServiceFee = transaction.retainedServiceFee !== undefined 
    ? transaction.retainedServiceFee 
    : (breakdown.service_fee || Math.round(originalTotal * 0.1 / 1.1));
  const protectionFee = breakdown.cancellation_fee || 0;
  const totalRetained = retainedPenalty + retainedServiceFee + protectionFee;
  const finalRefundAmount = transaction.refundAmount !== undefined 
    ? transaction.refundAmount 
    : Math.max(0, originalTotal - totalRetained);

  // Exact 3-Way Values
  const guestRefund = transaction.guestRefundAmount !== undefined 
    ? transaction.guestRefundAmount 
    : (transaction.refundAmount !== undefined ? transaction.refundAmount : finalRefundAmount);

  const hostShare = transaction.hostShare !== undefined 
    ? transaction.hostShare 
    : Math.round(retainedPenalty / 2);

  const adminShare = transaction.adminShare !== undefined 
    ? transaction.adminShare 
    : Math.max(0, originalTotal - guestRefund - hostShare);

  const hostPayout = transaction.hostPayoutAmount !== undefined 
    ? transaction.hostPayoutAmount 
    : Math.max(0, Math.round(originalTotal * 0.90));

  const adminRevenue = transaction.adminCommissionAmount !== undefined 
    ? transaction.adminCommissionAmount 
    : Math.max(0, originalTotal - hostPayout);

  const guestName = transaction.guestName || 'Valued Guest';
  const addressLines = (transaction.guestAddress || '').split('\n').map(s => s.trim()).filter(Boolean);
  const guestEmail = transaction.guestEmail || addressLines.find(l => l.includes('@')) || '';
  const guestPhone = transaction.guestPhone || addressLines.find(l => /^[+\d\s()-]{8,}$/.test(l)) || '';
  const guestLocation = transaction.guestLocation || addressLines.find(l => !l.includes('@') && !/^[+\d\s()-]{8,}$/.test(l)) || '';

  const hostName = transaction.hostName || 'StayCool Host';
  const hostEmail = transaction.hostEmail || '';
  const hostPhone = transaction.hostPhone || '';
  const propertyName = transaction.propertyName || 'StayCool Property';
  const propertyLocation = transaction.propertyLocation || '';
  const propertyAddress = transaction.propertyAddress || propertyLocation;

  const nights = transaction.nights || 1;

  return (
    <div className="bg-white max-w-[800px] mx-auto shadow-2xl rounded-2xl overflow-hidden text-zinc-900 font-sans border border-zinc-200 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      )}

      {/* 1. Header & Accent Bar */}
      <div className="bg-[#1f2128] p-8 relative">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-4">
            <img src="/assets/images/logo.png" alt="StayCool Logo" className="h-10 w-auto object-contain" />
            <img src="/assets/Picsart_26-03-22_23-32-24-684.png" alt="Secondary Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="text-right pr-6">
            <h2 className="text-4xl sm:text-5xl font-black text-[#0ea5e9] tracking-tighter italic">
              {isRefund ? 'REFUND INVOICE' : 'INVOICE'}
            </h2>
          </div>
        </div>
      </div>
      <div className="h-2 bg-[#0ea5e9]" />

      {/* 2. Comprehensive Info Section: Guest Details & Host Details */}
      <div className="bg-[#1f2128] px-6 sm:px-8 py-6 border-t border-white/5 space-y-5">
        {/* Top: Guest and Host/Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Guest Information Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Guest Details (Billed To)
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Guest
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white mb-2.5 tracking-tight">
                {guestName}
              </p>
              <div className="space-y-1.5 text-xs">
                {guestEmail && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Email</span>
                    <span className="font-medium truncate text-zinc-200">{guestEmail}</span>
                  </div>
                )}
                {guestPhone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Phone</span>
                    <span className="font-medium text-zinc-200">{guestPhone}</span>
                  </div>
                )}
                {guestLocation && (
                  <div className="flex items-start gap-2 text-zinc-300">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Location</span>
                    <span className="font-medium text-zinc-200">{guestLocation}</span>
                  </div>
                )}
                {!guestEmail && !guestPhone && (
                  <div className="text-xs text-zinc-400 font-medium whitespace-pre-line leading-relaxed">
                    {transaction.guestAddress || 'Contact details not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Host & Property Information Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Host & Property Details
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Host
                </span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white mb-2.5 tracking-tight">
                {hostName}
              </p>
              <div className="space-y-1.5 text-xs">
                {hostEmail && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Email</span>
                    <span className="font-medium truncate text-zinc-200">{hostEmail}</span>
                  </div>
                )}
                {hostPhone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Phone</span>
                    <span className="font-medium text-zinc-200">{hostPhone}</span>
                  </div>
                )}
                <div className="pt-2 mt-1 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="text-sky-400 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Property</span>
                    <span className="font-bold text-sky-300 truncate">{propertyName}</span>
                  </div>
                  {(propertyAddress || propertyLocation) && (
                    <div className="flex items-start gap-2 text-zinc-400">
                      <span className="text-zinc-500 font-bold uppercase text-[9px] w-14 shrink-0 tracking-wider">Address</span>
                      <span className="font-medium text-zinc-300 text-[11px] leading-tight">
                        {propertyAddress || propertyLocation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Booking & Stay Metadata Strip */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Invoice#</p>
            <p className="text-white font-bold font-mono text-sm">{invoiceId}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Date</p>
            <p className="text-white font-bold">{date}</p>
            {transaction.bookingDate && transaction.bookingDate !== date && (
              <p className="text-[10px] text-zinc-400 mt-0.5">Booked: {transaction.bookingDate}</p>
            )}
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Stay Period</p>
            {transaction.checkIn && transaction.checkOut ? (
              <div>
                <p className="text-white font-bold">{transaction.checkIn} - {transaction.checkOut}</p>
                <p className="text-[10px] text-sky-400 font-medium mt-0.5">
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 font-medium">Standard Stay</p>
            )}
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Room / Status</p>
            <div className="flex flex-col items-start gap-1">
              {transaction.room_type && (
                <p className="text-zinc-300 font-medium truncate max-w-full text-[11px]" title={transaction.room_type}>
                  {transaction.room_type}
                </p>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isRefund 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isRefund ? 'Refunded' : 'Confirmed / Paid'}
              </span>
            </div>
          </div>
        </div>

        {/* Refund Details Banner (If applicable) */}
        {isRefund && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {transaction.cancellationDate && (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-bold uppercase text-[9px] tracking-wider">Cancelled On:</span>
                <span className="text-white font-medium">{transaction.cancellationDate}</span>
              </div>
            )}
            {transaction.daysBeforeCheckIn !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold uppercase text-[9px] tracking-wider">Lead Time:</span>
                <span className="text-white font-medium">{transaction.daysBeforeCheckIn} Days Before</span>
              </div>
            )}
            {transaction.appliedPolicy && (
              <div className="flex items-center gap-2">
                <span className="text-sky-400 font-bold uppercase text-[9px] tracking-wider">Policy:</span>
                <span className="text-white font-bold">{transaction.appliedPolicy}</span>
              </div>
            )}
            {transaction.refundDate && (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">Refund Date:</span>
                <span className="text-emerald-300 font-medium">{transaction.refundDate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Items Table */}
      <div className="p-8 pb-4">
        <div className="bg-[#f8fafc] rounded-xl overflow-hidden border border-zinc-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-zinc-600 border-b border-zinc-200 bg-zinc-100">
                <th className="py-3 px-4 text-center uppercase w-[60px]">SL.</th>
                <th className="px-4 py-3 uppercase">Item Description</th>
                <th className="px-4 py-3 text-center uppercase w-[120px]">Price</th>
                <th className="px-4 py-3 text-center uppercase w-[70px]">Qty.</th>
                <th className="px-4 py-3 text-right uppercase w-[120px]">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(() => {
                const rows = [
                  { name: 'Accommodation Charges', price: breakdown.accommodation, isDiscount: false },
                  { name: 'Platform Service Fee', price: 0, isDiscount: false }
                ];
                if (breakdown.discount && breakdown.discount > 0) {
                  rows.push({ name: 'Bulk Discount Savings', price: breakdown.discount, isDiscount: true });
                }
                if (breakdown.upgrades && breakdown.upgrades > 0) {
                  rows.push({ name: 'Exclusive Upgrades', price: breakdown.upgrades, isDiscount: false });
                }
                if (breakdown.cancellation_fee && breakdown.cancellation_fee > 0) {
                  rows.push({ name: 'Cancellation Protection', price: breakdown.cancellation_fee, isDiscount: false });
                }
                
                return rows.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-200/80 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3.5 text-center font-bold text-zinc-400">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-zinc-800">{item.name}</td>
                    <td className="px-4 py-3.5 text-center text-zinc-600">
                      {item.isDiscount ? '-' : ''}Rs.{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-600">1</td>
                    <td className={`px-4 py-3.5 text-right font-bold ${item.isDiscount ? 'text-emerald-600' : 'text-sky-600'}`}>
                      {item.isDiscount ? '-' : ''}Rs.{item.price.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 3-Way Financial Settlement Matrix (Guest / Host / Admin) */}
      <div className="px-8 pb-4">
        <div className="p-4 rounded-xl border border-zinc-200 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRefund ? 'bg-rose-500' : 'bg-sky-500'} animate-pulse`} />
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {isRefund ? '3-Way Cancellation Settlement Distribution' : '3-Way Revenue & Payout Distribution'}
              </p>
            </div>
            <span className="text-[9px] font-mono font-bold text-zinc-500">
              Total Balanced: ₹{originalTotal.toLocaleString('en-IN')}
            </span>
          </div>

          {isRefund && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2 flex items-center justify-between text-[10px] text-sky-800">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <strong>Platform Fee Policy:</strong> The ₹{retainedServiceFee.toLocaleString('en-IN')} Platform Service Fee is 100% retained by Admin. Host receives ₹0 from service fee.
              </span>
              <span className="font-mono font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded text-[9px]">
                Host Fee Share: ₹0
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Column 1: Guest */}
            <div className={`p-3.5 rounded-xl border ${isRefund ? 'bg-emerald-50/70 border-emerald-200' : 'bg-blue-50/70 border-blue-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isRefund ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {isRefund ? 'Guest Refund Amount' : 'Total Guest Paid'}
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white font-bold text-zinc-600 border border-zinc-200">
                  Guest
                </span>
              </div>
              <p className={`text-xl font-black font-mono ${isRefund ? 'text-emerald-600' : 'text-blue-600'}`}>
                ₹{(isRefund ? guestRefund : originalTotal).toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-zinc-500 mt-1 font-medium leading-tight">
                {isRefund ? `Refunded (${refundPercent}% tier of ₹${netRefundablePool.toLocaleString('en-IN')} accommodation)` : 'Gross booking payment collected'}
              </p>
            </div>

            {/* Column 2: Host */}
            <div className="p-3.5 rounded-xl border bg-amber-50/70 border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
                  {isRefund ? 'Host Compensation' : 'Host Net Payout'}
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white font-bold text-zinc-600 border border-zinc-200">
                  Host
                </span>
              </div>
              <p className="text-xl font-black font-mono text-amber-600">
                ₹{(isRefund ? hostShare : hostPayout).toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-zinc-500 mt-1 font-medium leading-tight">
                {isRefund ? '50% retained accommodation penalty share (₹0 from platform fee)' : 'Net payable (after 10% platform commission)'}
              </p>
            </div>

            {/* Column 3: Admin */}
            <div className="p-3.5 rounded-xl border bg-sky-50/70 border-sky-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700">
                  {isRefund ? 'Admin Retained Share' : 'Admin Platform Revenue'}
                </span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white font-bold text-zinc-600 border border-zinc-200">
                  Admin
                </span>
              </div>
              <p className="text-xl font-black font-mono text-sky-600">
                ₹{(isRefund ? adminShare : adminRevenue).toLocaleString('en-IN')}
              </p>
              <p className="text-[9px] text-zinc-500 mt-1 font-medium leading-tight">
                {isRefund ? `100% Platform fee (₹${retainedServiceFee.toLocaleString('en-IN')}) + 50% penalty (₹${hostShare.toLocaleString('en-IN')})` : '10% guest fee + 10% host commission'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer Section - Separated cleanly below table */}
      <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-start border-t border-zinc-100 mt-4 gap-6 relative">
        {/* Left Side: Brand Note & Terms */}
        <div className="flex-1 space-y-4 max-w-[400px]">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Thank you for choosing</p>
            <p className="text-3xl font-black uppercase tracking-tight text-[#0ea5e9]">STAY COOL</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Terms & Conditions</p>
            <div className="space-y-1.5 text-[9px] leading-relaxed text-zinc-500">
              <p>• The guest is fully responsible for maintaining the property in good condition throughout the duration of their stay.</p>
              <p>• 100% full refund with Free Cancellation (₹70) or 70% refund standard if cancelled before check-in.</p>
              <p>• StayCool platform service fees are 100% retained by Admin and non-refundable upon cancellation.</p>
              <p>• <strong>StayCool No-Show Rule:</strong> If the guest fails to arrive at the property on the scheduled check-in date and check-in time, it will be considered a No-Show. No refund will be provided for No-Show bookings, unless StayCool&apos;s applicable refund policy applies.</p>
              <p>• Availability of luxury services and amenities is subject to change without prior notice.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Totals & Stamp */}
        <div className="w-full md:w-[300px] flex flex-col items-end space-y-4">
          <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-zinc-600">
              <span className="font-bold text-[10px] uppercase tracking-wider">
                {isRefund ? 'Original Total Paid:' : 'Total Guest Paid:'}
              </span>
              <span className="font-bold font-mono text-zinc-900">₹{originalTotal.toLocaleString('en-IN')}</span>
            </div>
            {isRefund && (
              <div className="flex justify-between items-center text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200/60">
                <span className="font-bold text-[9px] uppercase tracking-wider">
                  Platform Fee (100% Admin):
                </span>
                <span className="font-bold font-mono text-sky-900">₹{retainedServiceFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-amber-700">
              <span className="font-bold text-[10px] uppercase tracking-wider">
                {isRefund ? 'Payable to Host (Penalty Only):' : 'Host Net Payout:'}
              </span>
              <span className="font-bold font-mono">₹{(isRefund ? hostShare : hostPayout).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-sky-700">
              <span className="font-bold text-[10px] uppercase tracking-wider">
                {isRefund ? 'Retained by Admin (Fee + Penalty):' : 'Admin Platform Revenue:'}
              </span>
              <span className="font-bold font-mono">₹{(isRefund ? adminShare : adminRevenue).toLocaleString('en-IN')}</span>
            </div>
            <div className="h-px bg-zinc-200 my-1" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">
                {isRefund ? 'Net Refund to Guest:' : 'Grand Total Paid:'}
              </span>
              <span className={`text-xl font-black font-mono ${isRefund ? 'text-emerald-600' : 'text-[#0ea5e9]'}`}>
                ₹{(isRefund ? guestRefund : originalTotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Stamp Badge */}
          <div className="select-none pointer-events-none pt-2">
            {isRefund ? (
              <img src="/assets/images/refund-stamp.png" alt="Refunded" className="w-[180px] h-[75px] object-contain -rotate-6 opacity-90" />
            ) : (
              <img src="/assets/images/paid-stamp.png" alt="Paid" className="w-[180px] h-[75px] object-contain -rotate-6 opacity-90" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeInvoice;
