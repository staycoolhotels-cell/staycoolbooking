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
        label: 'Gross Revenue',
        data: data.map((d) => d.earnings),
        backgroundColor: 'rgba(168, 85, 247, 0.8)', // Purple-500
        hoverBackgroundColor: 'rgba(192, 132, 252, 1)', // Purple-400
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 0,
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#a855f7',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
      title: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: {
            size: 11,
            family: "'Inter', 'Arial', sans-serif",
            weight: 'bold',
          },
          callback: function (value: any) {
            return '₹' + (value / 1000) + 'k';
          }
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
            family: "'Inter', 'Arial', sans-serif",
            weight: 'bold',
          },
        },
        border: {
          display: false
        }
      },
    },
  };

  return (
    <div className="w-full h-full relative z-10">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default EarningsChart;
