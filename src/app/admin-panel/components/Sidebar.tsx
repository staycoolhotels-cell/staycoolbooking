'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { signOutUser } from '@/lib/auth-actions';
import { updateAdminCredentials } from '@/lib/admin-actions';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/admin-panel', label: 'Dashboard', icon: 'ChartBarIcon' },
  {
    href: '/admin-panel/property-management',
    label: 'Property Management',
    icon: 'HomeModernIcon',
  },
  { href: '/admin-panel/financials', label: 'Financials', icon: 'BanknotesIcon' },
  { href: '/admin-panel/user-management', label: 'User Management', icon: 'UsersIcon' },
  { href: '/admin-panel/marketing', label: 'Marketing', icon: 'MegaphoneIcon' },
  { href: '/admin-panel/reviews', label: 'Reviews', icon: 'ChatBubbleBottomCenterTextIcon' },
];

interface SidebarProps {
  isMobileMenuOpen: boolean;
  onMobileToggle: () => void;
  onCloseMobileMenu: () => void;
}

const Sidebar = ({ isMobileMenuOpen, onMobileToggle, onCloseMobileMenu }: SidebarProps) => {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [adminProfile, setAdminProfile] = React.useState<{ name: string, email: string, avatar_url: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, email, avatar_url')
          .eq('id', user.id)
          .single();
        if (profile) {
          setAdminProfile(profile);
        } else {
          setAdminProfile({
            name: user.user_metadata?.name || 'Admin User',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null
          });
        }
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Session expired. Please log in again.');

      let uploadedUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `admin-${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        uploadedUrl = publicUrl;
      }

      const result = await updateAdminCredentials(
        user.id,
        newEmail || undefined,
        newPassword || undefined,
        uploadedUrl || undefined
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });

        if (newEmail || uploadedUrl) {
          setAdminProfile(prev => prev ? {
            ...prev,
            email: newEmail || prev.email,
            avatar_url: uploadedUrl || prev.avatar_url
          } : null);
        }

        setTimeout(() => {
          setIsSettingsOpen(false);
          setNewEmail('');
          setNewPassword('');
          setAvatarFile(null);
          setAvatarPreview(null);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update credentials' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await signOutUser();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 top-[64px] bg-black/60 z-[90] backdrop-blur-sm"
            onClick={onCloseMobileMenu}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed top-[64px] bottom-0 left-0 z-[95] w-64 flex-shrink-0 bg-[#0a0a0f] border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobileMenu}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === link.href
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <Icon name={link.icon as any} size={22} />
              <span className="font-heading font-medium">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 py-6 border-t border-white/10 mt-auto relative">
          <AnimatePresence>
            {isProfileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-4 right-4 mb-2 bg-[#0f0f15] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 text-zinc-300 transition-colors"
                >
                  <Icon name="Cog6ToothIcon" size={18} />
                  <span className="font-heading font-medium text-sm">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors border-t border-white/10"
                >
                  <Icon name="ArrowLeftOnRectangleIcon" size={18} />
                  <span className="font-heading font-medium text-sm">Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 group text-left"
          >
            <div className="relative">
              <img
                src={adminProfile?.avatar_url || "https://i.pravatar.cc/40"}
                alt="Admin"
                className="w-10 h-10 rounded-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-[#0a0a0f]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                {adminProfile?.name || 'Admin User'}
              </p>
              <p className="text-xs text-zinc-500 truncate">Super Admin Profile</p>
            </div>
            <Icon
              name="ChevronUpIcon"
              size={18}
              className={`text-zinc-500 group-hover:text-white transition-all ${isProfileMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-8 shadow-3xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-white">Admin Settings</h3>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setMessage(null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                >
                  <Icon name="XMarkIcon" size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <img
                      src={avatarPreview || adminProfile?.avatar_url || "https://i.pravatar.cc/40"}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/10 group-hover:border-primary/50 transition-colors"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="CameraIcon" size={24} className="text-white" />
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Click to change photo</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">New Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || (!newEmail && !newPassword && !avatarFile)}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isSubmitting ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
