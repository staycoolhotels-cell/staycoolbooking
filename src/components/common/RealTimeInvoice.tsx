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
    accommodation: Math.round((transaction.amount || 0) / 1.1),
    service_fee: Math.round((transaction.amount || 0) * 0.1 / 1.1),
    taxes: 0,
    discount: 0,
    upgrades: 0,
    cancellation_fee: 0
  };

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

      {/* 2. Info Section */}
      <div className="bg-[#1f2128] px-8 py-8 flex border-t border-white/5">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Invoice to:</p>
          <p className="text-xl font-bold text-white mb-2">{transaction.guestName || 'Valued Guest'}</p>
          <div className="text-xs text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
            {transaction.guestAddress || 'Address not provided'}
          </div>
        </div>
        <div className="w-[280px] space-y-2">
          <div className="grid grid-cols-[140px_1fr] items-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice#</p>
            <p className="text-white font-bold">{invoiceId}</p>
          </div>
          <div className="grid grid-cols-[140px_1fr] items-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date:</p>
            <p className="text-white font-bold">{date}</p>
          </div>
          {transaction.bookingDate && (
            <div className="grid grid-cols-[140px_1fr] items-center pt-1 border-t border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Booking Date:</p>
              <p className="text-white font-bold">{transaction.bookingDate}</p>
            </div>
          )}
          {transaction.cancellationDate && (
            <div className="grid grid-cols-[140px_1fr] items-center text-rose-400">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Cancellation Date:</p>
              <p className="font-bold">{transaction.cancellationDate}</p>
            </div>
          )}
          {transaction.refundDate && (
            <div className="grid grid-cols-[140px_1fr] items-center text-emerald-400">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Refund Date:</p>
              <p className="font-bold">{transaction.refundDate}</p>
            </div>
          )}
          {isRefund && (
            <>
              {transaction.daysBeforeCheckIn !== undefined && (
                <div className="grid grid-cols-[140px_1fr] items-center text-amber-500 pt-1 border-t border-white/5">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Cancellation Lead:</p>
                  <p className="font-bold">{transaction.daysBeforeCheckIn} Days Before</p>
                </div>
              )}
              {transaction.appliedPolicy && (
                <div className="grid grid-cols-[140px_1fr] items-center text-sky-400">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Applied Policy:</p>
                  <p className="font-bold text-[10px] leading-tight">{transaction.appliedPolicy}</p>
                </div>
              )}
            </>
          )}
        </div>
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
                  { name: 'Platform Service Fee (10%)', price: breakdown.service_fee, isDiscount: false }
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

      {/* 4. Footer Section - Separated cleanly below table */}
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
              <p>• Refunds are processed according to the Tiered Refund Schedule based on cancellation timing relative to check-in.</p>
              <p>• StayCool acts solely as a platform provider and is not a direct party to the accommodation contract between the guest and host.</p>
              <p>• Availability of luxury services and amenities is subject to change without prior notice.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Totals & Stamp */}
        <div className="w-full md:w-[280px] flex flex-col items-end space-y-4">
          <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Sub Total:</p>
              <p className="font-bold text-zinc-800">Rs.{transaction.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="h-px bg-zinc-200" />
            <div className="flex justify-between items-center">
              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">{isRefund ? 'Total Refunded:' : 'Grand Total:'}</p>
              <p className="text-xl font-black text-[#0ea5e9] tracking-tight">Rs.{transaction.amount.toLocaleString('en-IN')}</p>
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
