import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Transaction } from '@/lib/types';

interface TransactionRowProps {
  transaction: Transaction;
  onViewDetails: (id: string) => void;
}

const TransactionRow = ({ transaction, onViewDetails }: TransactionRowProps) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    completed: { bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircleIcon' },
    confirmed: { bg: 'bg-success/10', text: 'text-success', icon: 'CheckCircleIcon' },
    pending: { bg: 'bg-warning/10', text: 'text-warning', icon: 'ClockIcon' },
    pending_payment: { bg: 'bg-warning/10', text: 'text-warning', icon: 'ClockIcon' },
    failed: { bg: 'bg-error/10', text: 'text-error', icon: 'XCircleIcon' },
    payment_failed: { bg: 'bg-error/10', text: 'text-error', icon: 'XCircleIcon' },
    refunded: { bg: 'bg-primary/10', text: 'text-primary', icon: 'ArrowUturnLeftIcon' },
    cancelled: { bg: 'bg-error/10', text: 'text-error', icon: 'XCircleIcon' },
  };

  const config = statusConfig[transaction.status] || { bg: 'bg-zinc-800', text: 'text-zinc-400', icon: 'ClockIcon' };

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
      <td className="px-4 py-4">
        <div className="font-heading font-medium text-zinc-200">{transaction.transactionId}</div>
        <div className="text-sm text-zinc-400">{transaction.date}</div>
      </td>
      <td className="px-4 py-4">
        <div className="text-zinc-200">{transaction.guestName}</div>
      </td>
      <td className="px-4 py-4">
        <div className="text-zinc-200">{transaction.hostName}</div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm text-zinc-200">{transaction.propertyName}</div>
      </td>
      <td className="px-4 py-4">
        <div className="font-heading font-semibold text-zinc-200">
          ₹{transaction.amount.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-zinc-400">{transaction.paymentMethod}</div>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-heading font-medium ${config.bg} ${config.text}`}
        >
          <Icon name={config.icon} size={14} />
          <span>{transaction.status.toUpperCase()}</span>
        </span>
      </td>
      <td className="px-4 py-4">
        <button
          onClick={() => onViewDetails(transaction.id)}
          className="text-sky-400 hover:text-sky-300 transition-colors duration-200 p-1 rounded-lg hover:bg-sky-400/10"
        >
          <Icon name="EyeIcon" size={20} />
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;
