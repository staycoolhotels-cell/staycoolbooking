'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import { Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
    id: string;
    property_id: string;
    name: string;
    status: 'available' | 'maintenance' | 'booked';
    created_at?: string;
}

interface RoomManagerProps {
    property: Property;
    onUpdate: () => void;
}

export default function RoomManager({ property, onUpdate }: RoomManagerProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchRooms();
    }, [property.id]);

    const fetchRooms = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('property_id', property.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching rooms:', error);
            toast.error('Failed to load rooms');
        } else {
            setRooms(data || []);
        }
        setLoading(false);
    };

    const handleAddRoom = async () => {
        if (!newRoomName.trim()) return;

        const { error } = await supabase
            .from('rooms')
            .insert([{ property_id: property.id, name: newRoomName }]);

        if (error) {
            toast.error('Failed to add room');
        } else {
            toast.success('Room added successfully');
            setNewRoomName('');
            setIsAdding(false);
            fetchRooms();
            onUpdate(); // Trigger parent update if needed (e.g. total_rooms count)
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure? This action cannot be undone.')) return;

        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) {
            toast.error('Failed to delete room');
        } else {
            toast.success('Room deleted');
            fetchRooms();
            onUpdate();
        }
    };

    const handleUpdateRoom = async () => {
        if (!editingRoom || !editingRoom.name.trim()) return;

        const { error } = await supabase
            .from('rooms')
            .update({ name: editingRoom.name, status: editingRoom.status })
            .eq('id', editingRoom.id);

        if (error) {
            toast.error('Failed to update room');
        } else {
            toast.success('Room updated');
            setEditingRoom(null);
            fetchRooms();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Rooms ({rooms.length})</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-sm text-white transition-colors"
                >
                    <Plus size={16} /> Add Room
                </button>
            </div>

            {isAdding && (
                <div className="flex gap-2 items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Room Name (e.g. 101, Suite A)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleAddRoom}
                        disabled={!newRoomName.trim()}
                        className="p-2 bg-green-600 hover:bg-green-500 rounded text-white disabled:opacity-50"
                    >
                        <Save size={16} />
                    </button>
                    <button
                        onClick={() => setIsAdding(false)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-500" />
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {rooms.length === 0 && !isAdding && (
                        <p className="text-center text-slate-500 py-4 italic">No rooms added yet. This property acts as a single unit.</p>
                    )}
                    {rooms.map((room) => (
                        <div key={room.id} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                            {editingRoom?.id === room.id ? (
                                <div className="flex-1 flex gap-2 items-center mr-2">
                                    <input
                                        type="text"
                                        value={editingRoom.name}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                                    />
                                    <select
                                        value={editingRoom.status}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as any })}
                                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                                    >
                                        <option value="available">Available</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="booked">Booked</option>
                                    </select>
                                    <button onClick={handleUpdateRoom} className="text-green-400 hover:text-green-300"><Save size={16} /></button>
                                    <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-300"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-slate-200">{room.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${room.status === 'available' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                room.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {room.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingRoom(room)}
                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
