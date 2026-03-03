'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Property, Amenity } from '@/lib/types';
import { approveProperty, rejectProperty } from '@/lib/admin-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Check,
    X,
    MapPin,
    Calendar,
    User,
    Bed,
    Bath,
    Home,
    Star,
    Shield,
    Info,
    Activity,
    Cpu,
    Zap,
    Layers,
    IndianRupee
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { JetBrains_Mono, Inter } from 'next/font/google';

// Font Configuration
const mono = JetBrains_Mono({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

const PropertyDetailsPage = () => {
    const router = useRouter();
    const params = useParams();
    const propertyId = params.id as string;

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('id', propertyId)
                    .single();

                if (error) {
                    console.error('Error fetching property:', error);
                } else {
                    setProperty(data);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (propertyId) {
            fetchPropertyDetails();
        }
    }, [propertyId]);

    const handleApprove = async () => {
        if (!property) return;

        setActionLoading(true);
        try {
            const result = await approveProperty(property.id);
            if (result) {
                setProperty({ ...property, status: 'active' });
            } else {
                alert('Failed to approve property');
            }
        } catch (error) {
            console.error('Error approving property:', error);
            alert('Failed to approve property');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!property) return;

        setActionLoading(true);
        try {
            const result = await rejectProperty(property.id, 'Rejected by admin');
            if (result) {
                setProperty({ ...property, status: 'rejected' });
            } else {
                alert('Failed to reject property');
            }
        } catch (error) {
            console.error('Error rejecting property:', error);
            alert('Failed to reject property');
        } finally {
            setActionLoading(false);
        }
    };

    // Tech Badge Component
    const TechBadge = ({ children, variant = 'default', icon: Icon }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger', icon?: any }) => {
        const colors = {
            default: 'border-white/10 text-zinc-400 bg-white/5',
            success: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
            warning: 'border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
            danger: 'border-rose-500/30 text-rose-400 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        };

        return (
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border text-[10px] uppercase tracking-wider font-mono", colors[variant])}>
                {Icon && <Icon className="w-3 h-3" />}
                {children}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={cn("flex items-center justify-center min-h-screen bg-black text-zinc-100", mono.className)}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="text-xs text-zinc-600 animate-pulse">Initializing System...</div>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-zinc-100">
                <div className="border border-zinc-800 bg-[#050505] p-8  max-w-md w-full text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                        <X className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">404: OBJECT NOT FOUND</h2>
                        <p className="text-zinc-500 text-sm mt-2 font-mono">The requested property entity could not be retrieved from the database.</p>
                    </div>
                    <Button onClick={() => router.push('/admin-panel/property-management')} variant="outline" className="w-full border-zinc-700 bg-black hover:bg-zinc-900 text-zinc-300 font-mono text-xs uppercase">
                        Return to Index
                    </Button>
                </div>
            </div>
        );
    }

    const displayImages = property.images && property.images.length > 0
        ? property.images
        : property.image_url ? [{ url: property.image_url, alt: property.title || property.name }] : [];
    const currentImage = displayImages[currentImageIndex] || displayImages[0];
    const currentImageUrl = currentImage ? (typeof currentImage === 'string' ? currentImage : currentImage.url) : null;

    return (
        <div className={cn("min-h-screen bg-black text-zinc-300 pb-20 selection:bg-emerald-500/20 selection:text-emerald-200", inter.className)}>
            <main className="pt-8 px-6 md:px-12 max-w-[1600px] mx-auto space-y-6">

                {/* Navigation & Status Module */}
                <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-12 flex items-center justify-between bg-[#050505] border border-white/10 p-4 rounded-lg">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin-panel/property-management')}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-zinc-500">Properties</span>
                                <span className="text-zinc-700">/</span>
                                <span className="text-zinc-100 font-medium truncate max-w-[200px]">{property.title || property.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <TechBadge variant={property.status === 'active' ? 'success' : property.status === 'pending' ? 'warning' : 'danger'}>
                                {property.status}
                            </TechBadge>
                            <div className="text-[10px] text-zinc-600 font-mono">ID: {property.id.slice(0, 8)}</div>
                        </div>
                    </div>
                </div>

                {/* Hero Grid */}
                <div className="grid grid-cols-12 gap-6 h-[500px]">
                    {/* Main Image - Takes 8 cols */}
                    <div className="col-span-12 md:col-span-8 relative group rounded-lg overflow-hidden border border-white/10 bg-[#050505]">
                        {currentImageUrl ? (
                            <Image
                                src={currentImageUrl}
                                alt={property.title || property.name || 'Property Image'}
                                fill
                                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 grayscale-[20%] group-hover:grayscale-0"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Activity className="w-12 h-12 text-zinc-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

                        {/* Image Gallery Controls */}
                        {displayImages.length > 1 && (
                            <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 z-20 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 max-w-[50%] justify-end">
                                {displayImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            idx === currentImageIndex ? "bg-emerald-500 w-4" : "bg-white/40 hover:bg-white/80 w-2"
                                        )}
                                        aria-label={`View image ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 p-8 space-y-2 pointer-events-none">
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{property.title || property.name}</h1>
                            <div className="flex items-center gap-4 text-zinc-400 font-mono text-xs pointer-events-auto">
                                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {property.location}</span>
                                {property.tier && <span className="flex items-center gap-1.5"><Star className="w-3 h-3" /> {property.tier} TIER</span>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - Takes 4 cols */}
                    <div className="col-span-12 md:col-span-4 grid grid-rows-3 gap-6">
                        {/* Price Card */}
                        <div className="row-span-1 bg-[#050505] border border-white/10 rounded-lg p-6 flex flex-col justify-center hover:border-white/20 transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20"><IndianRupee className="w-6 h-6 text-emerald-500" /></div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2 block">Revenue Potential</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-4xl text-white font-medium", mono.className)}>₹{property.price_per_night || property.price || 0}</span>
                                        <span className="text-zinc-600 text-sm">/ night</span>
                                    </div>
                                </div>

                                {(property.weekendPrice || property.weekend_price_per_night) && (
                                    <div className="text-right">
                                        <span className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider mb-2 block">Weekend</span>
                                        <div className="flex items-baseline gap-1 justify-end">
                                            <span className={cn("text-2xl text-emerald-400 font-medium", mono.className)}>₹{property.weekendPrice || property.weekend_price_per_night}</span>
                                            <span className="text-zinc-600 text-xs">/ night</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/50 w-0 group-hover:w-full transition-all duration-500" />
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="row-span-1 grid grid-cols-2 gap-4">
                            <div className="bg-[#050505] border border-white/10 rounded-lg p-4 flex flex-col justify-center hover:bg-white/5 transition-colors group">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase">Capacity</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="w-4 h-4 text-indigo-500" />
                                    <span className="text-xl text-zinc-200">{property.capacity || property.max_guests || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="bg-[#050505] border border-white/10 rounded-lg p-4 flex flex-col justify-center hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase">Bedrooms</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Bed className="w-4 h-4 text-purple-500" />
                                    <span className="text-xl text-zinc-200">{property.bedrooms}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="row-span-1 bg-[#050505] border border-white/10 rounded-lg p-6 flex flex-col justify-center">
                            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-3">System Actions</span>
                            <div className="flex gap-3">
                                {property.status !== 'active' && (
                                    <Button onClick={handleApprove} disabled={actionLoading} className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 h-10 rounded text-xs uppercase font-mono tracking-wide">
                                        Approve
                                    </Button>
                                )}
                                {property.status !== 'rejected' && (
                                    <Button onClick={handleReject} disabled={actionLoading} className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 h-10 rounded text-xs uppercase font-mono tracking-wide">
                                        Reject
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid (Bento) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Description - 2 Cols */}
                    <div className="md:col-span-2 bg-[#050505] border border-white/10 rounded-lg p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-20" />
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="w-5 h-5 text-zinc-600" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Property Manifest</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed font-light text-sm md:text-base">
                            {property.description || "No data available."}
                        </p>
                    </div>

                    {/* Metadata - 1 Col */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#050505] border border-white/10 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Cpu className="w-4 h-4 text-zinc-600" />
                                <h3 className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Specs</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Type</span>
                                    <span className="text-zinc-300 font-mono capitalize">{property.type || property.room_type || (property as any).property_type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Baths</span>
                                    <span className="text-zinc-300 font-mono">{property.bathrooms}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Created</span>
                                    <span className="text-zinc-300 font-mono">{new Date(property.created_at || '').toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features & Rules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amenities */}
                    <div className="bg-[#050505] border border-white/10 rounded-lg p-6 min-h-[300px]">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-4 h-4 text-yellow-500/50" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Modules (Amenities)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {property.amenities?.map((amenity, i) => {
                                const name = typeof amenity === 'string' ? amenity : amenity.name;
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 text-xs text-zinc-400">
                                        <div className="w-1 h-1 bg-zinc-500 rounded-full" />
                                        {name}
                                    </div>
                                )
                            })}
                            {(!property.amenities || property.amenities.length === 0) && (
                                <span className="text-zinc-700 text-xs font-mono">NO MODULES INSTALLED</span>
                            )}
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="bg-[#050505] border border-white/10 rounded-lg p-6 min-h-[300px]">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-4 h-4 text-emerald-500/50" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Protocols (Rules)</h3>
                        </div>
                        <div className="space-y-2">
                            {property.rules?.map((rule, i) => (
                                <div key={i} className="flex gap-3 text-sm text-zinc-400 p-2 border-l-2 border-zinc-800 hover:border-zinc-600 transition-colors">
                                    <span className="font-mono text-zinc-600">0{i + 1}</span>
                                    {rule}
                                </div>
                            ))}
                            {(!property.rules || property.rules.length === 0) && (
                                <span className="text-zinc-700 text-xs font-mono">NO PROTOCOLS DEFINED</span>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default PropertyDetailsPage;
