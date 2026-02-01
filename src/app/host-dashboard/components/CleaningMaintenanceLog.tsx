import React, { useState } from 'react';
import {
  MaintenanceAlert,
  CleaningChecklist,
  CleaningChecklistItem,
  AlertPriority,
} from '../types';
import { Wrench, CheckSquare, ListTodo, AlertTriangle } from 'lucide-react';

const dummyMaintenanceAlerts: MaintenanceAlert[] = [
  {
    id: 'ma1',
    propertyId: 'prop1',
    propertyName: 'Luxury Villa Beachfront',
    issue: 'Leaky faucet in master bathroom',
    reportedBy: 'Guest John Doe',
    reportedDate: '2024-01-13',
    status: 'New',
    priority: 'Urgent',
  },
  {
    id: 'ma2',
    propertyId: 'prop2',
    propertyName: 'Downtown Penthouse',
    issue: 'WiFi intermittent',
    reportedBy: 'Guest Jane Smith',
    reportedDate: '2024-01-12',
    status: 'In Progress',
    priority: 'High',
  },
  {
    id: 'ma3',
    propertyId: 'prop1',
    propertyName: 'Luxury Villa Beachfront',
    issue: 'Broken lightbulb in living room',
    reportedBy: 'Cleaning Staff',
    reportedDate: '2024-01-10',
    status: 'Resolved',
    priority: 'Low',
  },
];

const dummyCleaningChecklists: CleaningChecklist[] = [
  {
    id: 'cc1',
    propertyId: 'prop1',
    propertyName: 'Luxury Villa Beachfront',
    date: '2024-01-15',
    assignedTo: 'Maria',
    status: 'Pending',
    items: [
      { id: 'cci1', task: 'Clean all bathrooms', completed: false },
      { id: 'cci2', task: 'Vacuum all carpets', completed: false },
      { id: 'cci3', task: 'Change bed linens', completed: false },
      { id: 'cci4', task: 'Restock toiletries', completed: false },
    ],
  },
  {
    id: 'cc2',
    propertyId: 'prop2',
    propertyName: 'Downtown Penthouse',
    date: '2024-01-14',
    assignedTo: 'Carlos',
    status: 'Completed',
    items: [
      { id: 'cci5', task: 'Clean all bathrooms', completed: true },
      { id: 'cci6', task: 'Vacuum all carpets', completed: true },
      { id: 'cci7', task: 'Change bed linens', completed: true },
    ],
  },
];

const getPriorityColor = (priority: AlertPriority): string => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-500';
    case 'High':
      return 'bg-orange-500';
    case 'Medium':
      return 'bg-yellow-500';
    case 'Low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusColor = (
  status: 'New' | 'In Progress' | 'Resolved' | 'Pending' | 'Completed'
): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-500';
    case 'In Progress':
      return 'bg-yellow-500';
    case 'Resolved':
    case 'Completed':
      return 'bg-green-500';
    case 'Pending':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const CleaningMaintenanceLog: React.FC = () => {
  return (
    <div className="p-6 bg-zinc-950/50">
      <h1 className="text-3xl font-bold text-zinc-100 mb-6">Cleaning & Maintenance Log</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Maintenance Alerts</h2>
          <div className="space-y-3">
            {dummyMaintenanceAlerts.length > 0 ? (
              dummyMaintenanceAlerts.map((alert) => (
                <div key={alert.id} className="p-3 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{alert.issue}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs text-white ${getPriorityColor(alert.priority)}`}
                    >
                      <AlertTriangle size={12} className="inline-block mr-1" /> {alert.priority}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">Property: {alert.propertyName}</p>
                  <p className="text-sm text-zinc-400">
                    Reported by: {alert.reportedBy} on {alert.reportedDate}
                  </p>
                  <span
                    className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs text-white ${getStatusColor(alert.status)}`}
                  >
                    {alert.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/50">No maintenance alerts.</p>
            )}
          </div>
        </div>

        {/* Cleaning Checklists */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2.5rem] border border-white/10 p-5 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">Cleaning Checklists</h2>
          <div className="space-y-3">
            {dummyCleaningChecklists.length > 0 ? (
              dummyCleaningChecklists.map((checklist) => (
                <div key={checklist.id} className="p-3 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{checklist.propertyName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs text-white ${getStatusColor(checklist.status)}`}
                    >
                      {checklist.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Assigned to: {checklist.assignedTo} | Date: {checklist.date}
                  </p>
                  <ul className="list-disc list-inside text-sm text-white mt-2">
                    {checklist.items.map((item) => (
                      <li
                        key={item.id}
                        className={item.completed ? 'line-through text-white/50' : ''}
                      >
                        <CheckSquare size={16} className="inline-block mr-1" /> {item.task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-white/50">No cleaning checklists.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleaningMaintenanceLog;
