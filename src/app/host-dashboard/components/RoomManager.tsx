'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { Property } from '@/lib/types';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import ActionConfirmModal from '@/components/ui/ActionConfirmModal';
import { AMENITIES, CATEGORIZED_AMENITIES, AmenityItem } from '@/lib/amenities';

interface Room {
    id: string;
    property_id?: string;
    name: string;
    status: 'available' | 'maintenance' | 'booked';
    room_type?: string;
    room_amenities?: number[]; // IDs of amenities
    current_guest?: string;
    booking_id?: string;
    created_at?: string;
}

const PROPERTY_ROOM_TYPES: Record<string, string[]> = {
    'hotel': ['Standard Room', 'AC Room', 'Single Room', 'Double Room', 'Twin Room', 'Deluxe Room', 'Suite'],
    'home stay': ['Entire Home'],
    'apartment': ['Entire Apartment'],
    'villa': ['Entire Villa'],
    'resort': ['Entire Resort', 'Standard Room', 'AC Room', 'Deluxe Room', 'Cottage', 'Suite'],
    'dormitory': ['Dorm Bed', 'Single Bed', 'Double Bed', 'AC Bed'],
    'tent': ['Standard Tent', 'Luxury Tent'],
    'wooden stay': ['Standard Wooden Room', 'Deluxe Wooden Cabin'],
};

interface RoomManagerProps {
    property: Property;
    onUpdate: () => void;
}

export default function RoomManager({ property, onUpdate }: RoomManagerProps) {
    const isSingleUnit = ['Home Stay', 'Apartment', 'Villa'].includes(property.tier || property.type || '') || (property.room_types && property.room_types.includes('Entire Resort'));
    const isTent = (property.tier || property.type || '') === 'Tent';

    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomType, setNewRoomType] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

    const availableRoomTypes = (property.room_types && property.room_types.length > 0)
        ? property.room_types
        : (PROPERTY_ROOM_TYPES[(property.tier || property.type || '').toLowerCase()] || []);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!isSingleUnit) {
            fetchRooms();
        } else {
            setLoading(false);
        }
    }, [property.id, isSingleUnit]);

    useEffect(() => {
        if (availableRoomTypes.length > 0 && !newRoomType) {
            setNewRoomType(availableRoomTypes[0]);
        }
    }, [availableRoomTypes]);

    if (isSingleUnit) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center">
                <div className="p-4 bg-amber-500/10 rounded-full mb-4 border border-amber-500/20">
                    <Icon name="InformationCircleIcon" size={32} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Sub-Units Not Supported</h3>
                <p className="text-sm text-zinc-400 max-w-sm px-6">
                    {property.tier || property.type} assets function as single integrated units. Sub-unit division is not available for this property category.
                </p>
            </div>
        );
    }

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_rooms_realtime_status', {
                p_property_id: property.id
            });

            if (error) {
                console.error('Error fetching rooms:', error.message, error.code);
                const { data: tableData } = await supabase
                    .from('rooms')
                    .select('*')
                    .eq('property_id', property.id)
                    .order('created_at', { ascending: true });
                setRooms(tableData || []);
            } else {
                setRooms(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoom = async () => {
        if (!newRoomName.trim()) return;

        // Get default amenities for this room type from property level if available
        const roomTypeAmenities = (property as any).room_type_amenities?.[newRoomType] || [];

        const { error } = await supabase
            .from('rooms')
            .insert([{ 
                property_id: property.id, 
                name: newRoomName,
                room_type: newRoomType,
                room_amenities: roomTypeAmenities
            }]);

        if (error) {
            toast.error('Deployment failed');
        } else {
            toast.success('Sub-unit successfully deployed');
            setNewRoomName('');
            setIsAdding(false);
            fetchRooms();
            onUpdate();
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (error) {
            toast.error('Termination failed');
        } else {
            toast.success('Sub-unit terminated');
            fetchRooms();
            onUpdate();
        }
    };

    const handleUpdateRoom = async () => {
        if (!editingRoom || !editingRoom.name.trim()) return;

        const { error } = await supabase
            .from('rooms')
            .update({ 
                name: editingRoom.name, 
                status: editingRoom.status,
                room_type: editingRoom.room_type,
                room_amenities: editingRoom.room_amenities
            })
            .eq('id', editingRoom.id);

        if (error) {
            toast.error('Reconfiguration failed');
        } else {
            toast.success('Sub-unit reconfigured');
            setEditingRoom(null);
            fetchRooms();
        }
    };

    const toggleRoomAmenity = (amenityId: number) => {
        if (!editingRoom) return;
        
        const currentAmenities = editingRoom.room_amenities || [];
        const newAmenities = currentAmenities.includes(amenityId)
            ? currentAmenities.filter(id => id !== amenityId)
            : [...currentAmenities, amenityId];
            
        setEditingRoom({ ...editingRoom, room_amenities: newAmenities });
    };

    return (
        <div className="space-y-4 md:space-y-6 relative">
            <div className="flex justify-between items-center bg-black/40 border border-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-inner">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-indigo-500/20 rounded-lg">
                        <Icon name="QueueListIcon" size={16} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-black text-white leading-tight">
                            {isTent ? 'Active Tents' : 'Active Sub-Units'}
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Total Count: {rooms.length}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-500/50 shrink-0"
                >
                    <Icon name={isAdding ? "XMarkIcon" : "PlusIcon"} size={14} /> <span className="hidden sm:inline">{isAdding ? 'Cancel' : (isTent ? 'Deploy Tent' : 'Deploy Unit')}</span><span className="sm:hidden">{isAdding ? 'X' : 'Deploy'}</span>
                </button>
            </div>

            {isAdding && (
                <div className="flex flex-col gap-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icon name="TagIcon" size={16} className="text-indigo-400" />
                            </div>
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder={isTent ? 'Tent Identifier (e.g. Tent 1)' : 'Unit Identifier (e.g. 101)'}
                                className="w-full bg-black/50 border border-white/10 hover:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-zinc-600"
                            />
                        </div>
                        {availableRoomTypes.length > 0 && (
                            <div className="relative sm:w-64">
                                <select
                                    value={newRoomType}
                                    onChange={(e) => setNewRoomType(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 hover:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    {availableRoomTypes.map(type => (
                                        <option key={type} value={type} className="bg-zinc-900">{type}</option>
                                    ))}
                                </select>
                                <Icon name="ChevronDownIcon" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>
                        )}
                        <button
                            onClick={handleAddRoom}
                            disabled={!newRoomName.trim()}
                            className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                        >
                            <Icon name="CheckCircleIcon" size={16} /> Confirm
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Icon name="ArrowPathIcon" size={32} className="text-indigo-500 animate-spin mb-4" />
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Synchronizing Units...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rooms.length === 0 && !isAdding && (
                        <div className="flex flex-col items-center justify-center py-8 md:py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-xl md:rounded-2xl mx-1 md:mx-0">
                            <Icon name="SquaresPlusIcon" size={24} className="text-zinc-600 mb-2 md:mb-3" />
                            <p className="text-xs md:text-sm font-bold text-white mb-1">
                                {isTent ? 'No Tents Deployed' : 'No Sub-Units Deployed'}
                            </p>
                            <p className="text-[10px] md:text-xs text-zinc-500 text-center max-w-[200px] md:max-w-sm px-4">
                                {isTent
                                    ? 'No tents deployed yet. Add individual tents to manage them separately.'
                                    : 'This asset is currently functioning as a single integrated unit. Deploy sub-units to subdivide the property.'
                                }
                            </p>
                        </div>
                    )}

                    {rooms.map((room) => (
                        <div key={room.id} className="group flex flex-col bg-[#0a0a0f] backdrop-blur-md rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                                {editingRoom?.id === room.id ? (
                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3">
                                        <input
                                            type="text"
                                            value={editingRoom.name}
                                            onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                            className="flex-1 bg-black/60 border border-indigo-500/40 focus:border-indigo-500/80 rounded-lg px-3 py-2 text-sm text-white font-medium focus:outline-none transition-colors"
                                        />
                                        {availableRoomTypes.length > 0 && (
                                            <div className="relative sm:w-48 shrink-0">
                                                <select
                                                    value={editingRoom.room_type}
                                                    onChange={(e) => setEditingRoom({ ...editingRoom, room_type: e.target.value })}
                                                    className="w-full bg-black/60 border border-white/10 hover:border-white/30 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                                                >
                                                    {availableRoomTypes.map(type => (
                                                        <option key={type} value={type} className="bg-zinc-900">{type}</option>
                                                    ))}
                                                </select>
                                                <Icon name="ChevronDownIcon" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                            </div>
                                        )}
                                        <div className="relative sm:w-40 shrink-0">
                                            <select
                                                value={editingRoom.status}
                                                onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as any })}
                                                className="w-full bg-black/60 border border-white/10 hover:border-white/30 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="available" className="bg-zinc-900">Available</option>
                                                <option value="maintenance" className="bg-zinc-900">Maintenance</option>
                                                <option value="booked" className="bg-zinc-900">Booked</option>
                                            </select>
                                            <Icon name="ChevronDownIcon" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={handleUpdateRoom} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors flex justify-center items-center">
                                                <Icon name="CheckIcon" size={16} />
                                            </button>
                                            <button onClick={() => setEditingRoom(null)} className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg border border-white/10 transition-colors flex justify-center items-center">
                                                <Icon name="XMarkIcon" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex flex-wrap items-center justify-between gap-4 p-4 pl-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                                    <Icon name="Bed" size={14} className="text-sky-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-base">{room.name}</span>
                                                    {room.room_type && (
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{room.room_type}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border backdrop-blur-md
                                                ${room.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    room.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${room.status === 'available' ? 'bg-emerald-400 animate-pulse' :
                                                        room.status === 'maintenance' ? 'bg-amber-400' :
                                                            'bg-purple-400'
                                                    }`} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{room.status}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center p-2 sm:border-l border-white/5 sm:bg-white/[0.02]">
                                            <button
                                                onClick={() => setEditingRoom(room)}
                                                className="p-3 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                title="Configure"
                                            >
                                                <Icon name="Cog6ToothIcon" size={18} />
                                            </button>
                                            <button
                                                onClick={() => setRoomToDelete(room.id)}
                                                className="p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Terminate"
                                            >
                                                <Icon name="TrashIcon" size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ActionConfirmModal
                isOpen={!!roomToDelete}
                onClose={() => setRoomToDelete(null)}
                onConfirm={() => {
                    if (roomToDelete) handleDeleteRoom(roomToDelete);
                    setRoomToDelete(null);
                }}
                title="Terminate Sub-Unit?"
                description="Are you certain? This termination cannot be reversed and all history for this unit will be archived."
                confirmLabel="Terminate Unit"
                variant="danger"
            />
        </div>
    );
}
