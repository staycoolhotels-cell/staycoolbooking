'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { WishlistItem } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type SmartWishlistProps = {
  wishlist: WishlistItem[];
  userId: string;
  onRemove?: (itemId: string) => void;
  onBoardChange?: () => void; // Optional callback to refresh parent
};

const SmartWishlist = ({ wishlist: initialWishlist, userId, onRemove, onBoardChange }: SmartWishlistProps) => {
  const router = useRouter();
  // Local copy of wishlist so we can do optimistic updates
  const [items, setItems] = useState<WishlistItem[]>(initialWishlist ?? []);

  // Ensure we keep track of valid boards that have items + any newly created empty boards
  const dbBoards = useMemo(() => {
    return Array.from(new Set(items.map(item => item.board).filter(Boolean))) as string[];
  }, [items]);

  const [activeBoard, setActiveBoard] = useState<string>('All');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [copiedBoard, setCopiedBoard] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');

  // Dropdown: which item's dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Network ops in progress
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Local state for empty boards that haven't been saved with items yet
  const [localBoards, setLocalBoards] = useState<string[]>([]);

  // All combined boards for display
  const allBoards = useMemo(() => {
    return Array.from(new Set([...dbBoards, ...localBoards]));
  }, [dbBoards, localBoards]);

  // Sync items if parent prop updates
  useEffect(() => {
    setItems(initialWishlist ?? []);
  }, [initialWishlist]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filteredWishlist =
    activeBoard === 'All'
      ? items
      : items.filter((item) => item.board === activeBoard);

  const submitCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newBoardName.trim();
    if (!trimmedName) return;
    if (allBoards.includes(trimmedName)) {
      alert('A board with this name already exists.');
      return;
    }
    setLocalBoards(prev => [...prev, trimmedName]);
    setActiveBoard(trimmedName);
    setIsCreateModalOpen(false);
    setNewBoardName('');
  };

  const deleteBoard = async (boardName: string) => {

    // Remote update to remove this board from all items
    try {
      // Optioistic update
      setItems(prev => prev.map(item =>
        item.board === boardName ? { ...item, board: '' } : item
      ));
      setLocalBoards(prev => prev.filter(b => b !== boardName));
      if (activeBoard === boardName) setActiveBoard('All');

      const { error } = await supabase
        .from('wishlist')
        .update({ board: null })
        .eq('board', boardName)
        .eq('user_id', userId);

      if (error) throw error;
      onBoardChange?.();
    } catch (err) {
      console.error('Failed to delete board:', err);
      alert('Failed to delete board from database.');
    } finally {
      setBoardToDelete(null);
    }
  };

  const assignToBoard = async (itemId: string, boardName: string | null) => {
    setOpenDropdown(null);
    setMovingId(itemId);

    // Save previous state for rollback
    const prevItems = [...items];

    // Optimistic UI update
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, board: boardName || '' } : item
    ));

    try {
      const { error } = await supabase
        .from('wishlist')
        .update({ board: boardName })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
      onBoardChange?.();
    } catch (err) {
      console.error('Failed to move item to board:', err);
      setItems(prevItems); // Rollback
      alert('Failed to move item. Please try again.');
    } finally {
      setMovingId(null);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to remove from wishlist:', error);
        alert('Failed to remove item. Please try again.');
        return;
      }

      // Optimistic UI update
      setItems((prev) => prev.filter((i) => i.id !== itemId));

      // Notify parent
      onRemove?.(itemId);
    } finally {
      setRemovingId(null);
    }
  };

  const shareBoard = (boardName: string) => {
    const url = `${window.location.origin}/wishlist/shared/${userId}/${encodeURIComponent(boardName)}`;
    navigator.clipboard.writeText(url);
    setCopiedBoard(boardName);
    setTimeout(() => setCopiedBoard(null), 2000);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2rem] shadow-xl p-6 shadow-sky-900/5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Smart Wishlist</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-sky-500/20 text-sky-400 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-sky-500/30 transition border border-sky-500/20"
        >
          <Icon name="PlusCircleIcon" size={16} />
          Create Board
        </button>
      </div>

      {/* Board Tabs */}
      <div className="flex gap-2 mb-4 border-b border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveBoard('All')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeBoard === 'All'
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
        >
          All ({items.length})
        </button>
        {allBoards.map((board) => {
          const count = items.filter((i) => i.board === board).length;
          return (
            <div key={board} className="relative group/tab flex-shrink-0">
              <button
                onClick={() => setActiveBoard(board)}
                className={`pr-7 pl-3 py-1.5 rounded-full text-sm transition-all whitespace-nowrap ${activeBoard === board
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
              >
                {board} ({count})
              </button>
              {/* Delete board button */}
              <button
                onClick={(e) => { e.stopPropagation(); setBoardToDelete(board); }}
                title="Delete board"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-400 opacity-0 group-hover/tab:opacity-100 transition-all text-xs leading-none"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredWishlist.length > 0 ? (
            filteredWishlist.map((item, i) => {
              const prop = (item.property || (item as any).properties) as any;
              const imgs: any[] = Array.isArray(prop?.images) ? prop.images : [];
              const imgSrc = imgs.length > 0
                ? (typeof imgs[0] === 'string' ? imgs[0] : (imgs[0]?.url ?? imgs[0]?.uri ?? ''))
                : (prop?.image_url || '/placeholder.jpg');
              const assignedBoard = item.board || null;
              const isRemoving = removingId === item.id;
              const isMoving = movingId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isRemoving || isMoving ? 0.5 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/property-listing/${prop?.id}`)}
                  className="bg-zinc-950/50 border border-white/5 rounded-2xl relative flex hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  {/* Thumbnail */}
                  <img
                    src={imgSrc}
                    alt={prop?.title || prop?.name || 'Property'}
                    className="w-28 h-28 object-cover flex-shrink-0 rounded-l-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                  />

                  {/* Info */}
                  <div className="p-4 flex flex-col justify-center flex-grow min-w-0">
                    <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                      {prop?.title ?? prop?.name ?? 'Property'}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-0.5 truncate">{prop?.location ?? ''}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1.5">
                      ₹{prop?.price_per_night ?? prop?.price ?? '—'}{' '}
                      <span className="text-zinc-500 font-normal text-xs">/ night</span>
                    </p>
                    {assignedBoard && (
                      <span className="mt-1.5 inline-flex items-center w-fit gap-1 bg-sky-500/10 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-500/20">
                        <Icon name="FolderIcon" size={10} />
                        {assignedBoard}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center justify-center pr-3 gap-2 relative flex-shrink-0">
                    {/* Board Assignment Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          setOpenDropdown(openDropdown === item.id ? null : item.id);
                        }}
                        title="Move to board"
                        disabled={isRemoving || isMoving}
                        className="p-2 rounded-lg text-zinc-500 hover:text-sky-400 hover:bg-zinc-800 transition disabled:opacity-40"
                      >
                        {isMoving ? <Icon name="ArrowPathIcon" size={16} className="animate-spin" /> : <Icon name="FolderPlusIcon" size={16} />}
                      </button>

                      <AnimatePresence>
                        {openDropdown === item.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-10 z-30 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/60 min-w-[170px] py-1 overflow-hidden"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                            }}
                          >
                            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 px-3 pt-2 pb-1">
                              Move to board
                            </p>

                            {assignedBoard && (
                              <button
                                onClick={() => assignToBoard(item.id, null)}
                                className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                              >
                                ✕ Remove from board
                              </button>
                            )}

                            {allBoards.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-zinc-600 italic">
                                No boards yet. Create one first.
                              </p>
                            ) : (
                              allBoards.map((board) => (
                                <button
                                  key={board}
                                  onClick={() => assignToBoard(item.id, board)}
                                  className={`w-full text-left px-3 py-1.5 text-sm transition ${assignedBoard === board
                                    ? 'text-sky-400 bg-sky-500/10 font-semibold'
                                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                    }`}
                                >
                                  {assignedBoard === board ? '✓ ' : ''}{board}
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Remove from wishlist */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        removeFromWishlist(item.id);
                      }}
                      title="Remove from wishlist"
                      disabled={isRemoving || isMoving}
                      className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-40"
                    >
                      {isRemoving
                        ? <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                        : <Icon name="HeartIcon" size={16} variant="solid" className="text-red-400" />
                      }
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800"
            >
              <Icon name="HeartIcon" className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-400 font-medium">No properties in this board yet.</p>
              <p className="text-xs text-zinc-500 mt-1">
                {activeBoard === 'All'
                  ? 'Explore and save your favorites!'
                  : 'Use the 📁 icon on a property to move it here.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Button */}
      {activeBoard !== 'All' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => shareBoard(activeBoard)}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mx-auto transition-colors"
          >
            {copiedBoard === activeBoard ? (
              <>
                <Icon name="CheckCircleIcon" size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Icon name="Share2Icon" size={14} />
                Share &quot;{activeBoard}&quot; board
              </>
            )}
          </button>
        </div>
      )}

      {/* Create Board Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-sky-500/20 p-2 rounded-full text-sky-400">
                  <Icon name="PlusIcon" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">New Board</h3>
              </div>
              <form onSubmit={submitCreateBoard}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Board Name</label>
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="e.g. Summer Vacation, Cabin Trip..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  After creating, use the <span className="text-sky-400">📁 icon</span> on each property to assign it to this board.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-zinc-400 font-medium hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newBoardName.trim()}
                    className="bg-sky-500 text-white px-5 py-2 rounded-xl font-bold disabled:opacity-50 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Board Modal */}
      <AnimatePresence>
        {boardToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setBoardToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500/20 p-2 rounded-full text-red-400">
                  <Icon name="TrashIcon" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Delete Board</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-6 font-medium leading-relaxed">
                Delete board &quot;<span className="text-white font-bold">{boardToDelete}</span>&quot;?
                <br />Items will remain in your wishlist.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setBoardToDelete(null)}
                  className="px-4 py-2 text-zinc-400 font-medium hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBoard(boardToDelete)}
                  className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartWishlist;
