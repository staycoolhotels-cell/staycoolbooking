'use client';

import React, { useState } from 'react'; // Import useState
import EarningsChart from './EarningsChart';
import { Earning } from '../types';

interface EarningsProps {
  earnings: Earning[];
}

const Earnings = ({ earnings }: EarningsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Year'); // State for select

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Your Earnings</h2>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border border-border rounded-lg bg-input text-text-primary"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option>Weekly</option>
            <option>Monthly</option>
            <option>This Year</option>
            <option>Last Year</option>
          </select>
          <button
            onClick={() => console.log(`Exporting earnings for: ${selectedPeriod}`)}
            className="px-4 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold"
          >
            Export
          </button>
        </div>
      </div>
      <div>
        <EarningsChart data={earnings} />
      </div>
    </div>
  );
};

export default Earnings;
