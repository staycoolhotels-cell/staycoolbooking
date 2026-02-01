'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProfileProps {
  hostName: string;
  hostEmail: string;
  hostPhotoUrl: string;
  phoneNumber: string;
  address: string;
  bio: string;
  onUpdateHostName: (newName: string) => void;
  onUpdateHostEmail: (newEmail: string) => void;
  onUpdateHostPhoto: (newPhotoUrl: string) => void;
  onUpdatePhoneNumber: (newPhoneNumber: string) => void;
  onUpdateAddress: (newAddress: string) => void;
  onUpdateBio: (newBio: string) => void;
}

const Profile = ({
  hostName,
  hostEmail,
  hostPhotoUrl,
  phoneNumber,
  address,
  bio,
  onUpdateHostName,
  onUpdateHostEmail,
  onUpdateHostPhoto,
  onUpdatePhoneNumber,
  onUpdateAddress,
  onUpdateBio,
}: ProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(hostName);
  const [editedEmail, setEditedEmail] = useState(hostEmail);
  const [editedPhoneNumber, setEditedPhoneNumber] = useState(phoneNumber);
  const [editedAddress, setEditedAddress] = useState(address);
  const [editedBio, setEditedBio] = useState(bio);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
  }, [hostName, hostEmail, phoneNumber, address, bio]);

  const handleSave = () => {
    onUpdateHostName(editedName);
    onUpdateHostEmail(editedEmail);
    onUpdatePhoneNumber(editedPhoneNumber);
    onUpdateAddress(editedAddress);
    onUpdateBio(editedBio);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(hostName);
    setEditedEmail(hostEmail);
    setEditedPhoneNumber(phoneNumber);
    setEditedAddress(address);
    setEditedBio(bio);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateHostPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Your Profile</h2>
      <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to p-8 rounded-lg shadow-md">
        <div className="flex items-center space-x-6">
          <div className="relative">
            {hostPhotoUrl ? (
              <img src={hostPhotoUrl} alt="Host Avatar" className="w-24 h-24 rounded-full" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-text-secondary text-sm">
                No Photo
              </div>
            )}
            {isEditing && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary/80"
              >
                <Icon name="PencilIcon" size={16} />
              </button>
            )}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-3xl font-bold text-text-primary bg-input border-border border rounded-lg px-2 py-1"
              />
            ) : (
              <h3 className="text-3xl font-bold text-text-primary">{hostName}</h3>
            )}
            <p className="text-text-secondary">Host</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-text-secondary">Full Name</label>
            <p className="text-lg text-text-primary font-semibold">{hostName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                className="w-full text-lg text-text-primary font-semibold bg-input border-border border rounded-lg px-2 py-1"
              />
            ) : (
              <p className="text-lg text-text-primary font-semibold">{hostEmail}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={editedPhoneNumber}
                onChange={(e) => setEditedPhoneNumber(e.target.value)}
                className="w-full text-lg text-text-primary font-semibold bg-input border-border border rounded-lg px-2 py-1"
              />
            ) : (
              <p className="text-lg text-text-primary font-semibold">{phoneNumber}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Address</label>
            {isEditing ? (
              <input
                type="text"
                value={editedAddress}
                onChange={(e) => setEditedAddress(e.target.value)}
                className="w-full text-lg text-text-primary font-semibold bg-input border-border border rounded-lg px-2 py-1"
              />
            ) : (
              <p className="text-lg text-text-primary font-semibold">{address}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-text-secondary">Bio</label>
            {isEditing ? (
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="w-full text-lg text-text-primary font-semibold bg-input border-border border rounded-lg px-2 py-1"
                rows={3}
              />
            ) : (
              <p className="text-lg text-text-primary font-semibold">{bio}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">Joined On</label>
            <p className="text-lg text-text-primary font-semibold">January 2024</p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          {isEditing ? (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-muted text-text-primary rounded-lg font-semibold hover:bg-muted-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-gradient-to-br from-gradient-primary-from to-gradient-primary-to text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Update Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
