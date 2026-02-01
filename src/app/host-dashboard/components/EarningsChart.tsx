'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface EarningsChartProps {
  data: { month: string; earnings: number }[];
}

const EarningsChart = ({ data }: EarningsChartProps) => {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Earnings',
        data: data.map((d) => d.earnings),
        backgroundColor:
          'rgba(var(--color-primary-r), var(--color-primary-g), var(--color-primary-b), 0.8)',
        borderColor:
          'rgba(var(--color-primary-r), var(--color-primary-g), var(--color-primary-b), 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options: any = {
    // Use 'any' for now to bypass strict type checking for chart.js options
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Monthly Earnings',
        font: {
          size: 18,
          color: 'rgb(var(--color-text-primary))',
        },
      },
      tooltip: {
        titleColor: 'rgb(var(--color-text-primary))',
        bodyColor: 'rgb(var(--color-text-secondary))',
        backgroundColor: 'rgb(var(--color-card))',
        borderColor: 'rgb(var(--color-border))',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgb(var(--color-text-secondary))',
        },
        grid: {
          color: 'rgb(var(--color-border))',
        },
      },
      x: {
        ticks: {
          color: 'rgb(var(--color-text-secondary))',
        },
        grid: {
          color: 'rgb(var(--color-border))',
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to p-6 rounded-lg shadow-md">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default EarningsChart;
