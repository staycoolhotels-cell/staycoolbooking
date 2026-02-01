import React from 'react';
import { Transaction } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const TransactionDetailsModal = ({ transaction, onClose }: TransactionDetailsModalProps) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transaction Details</h2>
          <button onClick={onClose}>
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>
        <div className="space-y-2">
          <p>
            <strong>Transaction ID:</strong> {transaction.transactionId}
          </p>
          <p>
            <strong>Date:</strong> {transaction.date}
          </p>
          <p>
            <strong>Guest:</strong> {transaction.guestName}
          </p>
          <p>
            <strong>Host:</strong> {transaction.hostName}
          </p>
          <p>
            <strong>Property:</strong> {transaction.propertyName}
          </p>
          <p>
            <strong>Amount:</strong> {transaction.amount}
          </p>
          <p>
            <strong>Status:</strong> {transaction.status}
          </p>
          <p>
            <strong>Payment Method:</strong> {transaction.paymentMethod}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
