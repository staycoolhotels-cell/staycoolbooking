import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';

interface UserDetailsModalProps {
  user: User | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateUser: (id: string, updatedUser: Partial<User>) => void;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
}

const UserDetailsModal = ({
  user,
  onClose,
  onDelete,
  onUpdateUser,
  onApprove,
  onSuspend,
}: UserDetailsModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedRole, setEditedRole] = useState(user?.role);
  const [editedStatus, setEditedStatus] = useState(user?.status);

  useEffect(() => {
    if (user) {
      setEditedName(user.name || '');
      setEditedEmail(user.email || '');
      setEditedRole(user.role);
      setEditedStatus(user.status);
      setIsEditing(false); // Reset editing mode when user changes
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    onUpdateUser(user.id, {
      name: editedName,
      email: editedEmail,
      role: editedRole,
      status: editedStatus,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit User' : 'User Details'}</h2>
          <button onClick={onClose}>
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>
        <div className="space-y-2">
          {isEditing ? (
            <>
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Name:</label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full p-2 rounded-md bg-muted border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Email:</label>
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="w-full p-2 rounded-md bg-muted border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Role:</label>
                <select
                  value={editedRole}
                  onChange={(e) => setEditedRole(e.target.value as 'guest' | 'host' | 'admin')}
                  className="w-full p-2 rounded-md bg-muted border border-border"
                >
                  <option value="guest">Guest</option>
                  <option value="host">Host</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Status:</label>
                <select
                  value={editedStatus}
                  onChange={(e) =>
                    setEditedStatus(
                      e.target.value as 'active' | 'pending' | 'rejected'
                    )
                  }
                  className="w-full p-2 rounded-md bg-muted border border-border"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <p>
                <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Role:</strong> {user.role}
              </p>
              <p>
                <strong>Status:</strong> {user.status}
              </p>
              <p>
                <strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
        <div className="flex space-x-2 mt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Save</span>
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="w-full px-4 py-2 bg-muted hover:bg-muted-foreground/10 rounded-lg font-heading font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
             <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Edit</span>
              </button>
              {user.role === 'host' && user.status === 'pending' && (
                <button
                  onClick={() => onApprove(user.id)}
                  className="w-full px-4 py-2 bg-success text-success-foreground rounded-lg font-heading font-semibold hover:bg-success/90 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Approve Host</span>
                </button>
              )}
               <button
                onClick={() => onSuspend(user.id)}
                className="w-full px-4 py-2 bg-warning text-warning-foreground rounded-lg font-heading font-semibold hover:bg-warning/90 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Suspend</span>
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="w-full px-4 py-2 bg-error/10 text-error rounded-lg font-heading font-semibold hover:bg-error/20 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
