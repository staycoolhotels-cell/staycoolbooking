'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/AppIcon';
import { WishlistItem } from '@/lib/types';

type SmartWishlistProps = {
  wishlist: WishlistItem[];
};

const SmartWishlist = ({ wishlist }: SmartWishlistProps) => {
  const boards = [...new Set(wishlist.map((item) => item.board))];
  const [activeBoard, setActiveBoard] = useState(boards[0] || 'All');

  const filteredWishlist =
    activeBoard === 'All' ? wishlist : wishlist.filter((item) => item.board === activeBoard);

  const shareBoard = (boardName: string) => {
    // In a real app, this would open a sharing modal
    alert(`Sharing your board: ${boardName}`);
  };

  return (
    <div className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to border border-border rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Smart Wishlist</h2>
        <button className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/30 transition">
          <Icon name="PlusCircleIcon" size={16} />
          Create Board
        </button>
      </div>

      {/* Board Filters */}
      <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveBoard('All')}
          className={`px-3 py-1 rounded-full text-sm ${
            activeBoard === 'All' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          All
        </button>
        {boards.map((board) => (
          <button
            key={board}
            onClick={() => setActiveBoard(board)}
            className={`px-3 py-1 rounded-full text-sm ${
              activeBoard === board ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {board}
          </button>
        ))}
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredWishlist.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-800/50 rounded-lg overflow-hidden relative"
            >
              <img
                src={item.property.images[0]}
                alt={item.property.title}
                className="h-32 w-full object-cover"
              />
              <div className="p-3">
                {/* Price Drop Alert */}
                {i === 0 && ( // Simulate a price drop on the first item
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Icon name="TrendingDownIcon" size={14} />
                    Price Drop!
                  </div>
                )}
                <h3 className="font-semibold text-white">{item.property.title}</h3>
                <p className="text-xs text-gray-400">{item.property.location}</p>
                <p className="text-sm font-bold text-primary mt-1">
                  ₹{item.property.price_per_night} / night
                </p>

                {/* Group Planning Feature */}
                {item.board === 'Summer Escapes' &&
                  i === 0 && ( // Simulate group planning on one item
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Group Votes:</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👍 3</span>
                        <span className="text-sm">👎 1</span>
                        <button className="ml-auto text-xs bg-blue-600/30 text-blue-300 px-2 py-1 rounded-md">
                          Vote
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Share Button */}
      {activeBoard !== 'All' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => shareBoard(activeBoard)}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mx-auto"
          >
            <Icon name="Share2Icon" size={14} />
            Share "{activeBoard}" board
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartWishlist;
