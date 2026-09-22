'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Property } from '@/lib/types';
import { approveProperty, rejectProperty } from '@/lib/admin-actions';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    MapPin,
    User,
    Bed,
    Star,
    Shield,
    Activity,
    Cpu,
    Zap,
    Layers,
    IndianRupee,
    FileText,
    Download,
    Eye,
    CreditCard,
    Clock,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    Ban,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Building2,
    Landmark,
    Hash,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { AMENITIES } from '@/lib/amenities';

// Font Configuration
const mono = JetBrains_Mono({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

type KycRecord = {
    id: string;
    user_id: string;
    legal_business_name: string;
    email: string;
    phone: string;
    pan_number: string;
    bank_account_number: string;
    bank_ifsc: string;
    bank_beneficiary_name: string;
    razorpay_account_id: string | null;
    razorpay_product_id: string | null;
    kyc_status: 'pending' | 'under_review' | 'activated' | 'needs_clarification' | 'suspended';
    kyc_error_message: string | null;
    created_at: string;
    updated_at: string;
    host_name: string;
    host_email: string;
} | null;

interface PropertyDetailsClientProps {
    property: Property;
    kycRecord: KycRecord;
}

const kycStatusConfig: Record<string, { label: string; icon: React.ElementType; cls: string; dotCls: string }> = {
    pending: { label: 'Pending', icon: Clock, cls: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600', dotCls: 'bg-zinc-400' },
    under_review: { label: 'Under Review', icon: HelpCircle, cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', dotCls: 'bg-yellow-400' },
    activated: { label: 'Activated', icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dotCls: 'bg-emerald-400' },
    needs_clarification: { label: 'Needs Clarification', icon: AlertCircle, cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30', dotCls: 'bg-orange-400' },
    suspended: { label: 'Suspended', icon: Ban, cls: 'bg-red-500/15 text-red-400 border border-red-500/30', dotCls: 'bg-red-400' },
};

const PropertyDetailsClient = ({ property, kycRecord }: PropertyDetailsClientProps) => {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState(false);
    const [currentProperty, setCurrentProperty] = useState(property);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [expandedRoomTypes, setExpandedRoomTypes] = useState<Record<string, boolean>>({});

    const resolveAmenityName = (id: number): string => {
        // 1. Try to find in standard AMENITIES list
        const stdAmenity = AMENITIES.find(a => a.id === id);
        if (stdAmenity) return stdAmenity.name;
        
        // 2. Try to find in the property's own amenities (which includes custom ones saved by host)
        if (currentProperty.amenities) {
            const propAmenity = currentProperty.amenities.find((a: any) => a && typeof a === 'object' && Number(a.id) === id);
            if (propAmenity && (propAmenity as any).name) {
                return (propAmenity as any).name;
            }
        }
        
        return `Amenity #${id}`;
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const result = await approveProperty(currentProperty.id);
            if (result) {
                const newStatus = typeof result === 'object' && result && 'status' in result ? (result as any).status : 'active';
                const kycPending = typeof result === 'object' && result && (result as any).kycPending;
                
                setCurrentProperty({ ...currentProperty, status: newStatus });
                
                if (kycPending) {
                    toast.success('Property approved successfully! (Placed Offline pending host KYC)');
                } else {
                    toast.success('Property approved successfully and is now active!');
                }
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
        setActionLoading(true);
        try {
            const result = await rejectProperty(currentProperty.id, 'Rejected by admin');
            if (result) {
                setCurrentProperty({ ...currentProperty, status: 'rejected' });
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

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
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

    // Safe Date Formatter
    const formatDate = (dateString: string | undefined | null, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-IN', options);
    };

    const formatDateTime = (dateString: string | undefined | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const displayImages = currentProperty.images && currentProperty.images.length > 0
        ? currentProperty.images
        : currentProperty.image_url ? [{ url: currentProperty.image_url, alt: currentProperty.title || currentProperty.name }] : [];
    const currentImage = displayImages[currentImageIndex] || displayImages[0];
    const currentImageUrl = currentImage ? (typeof currentImage === 'string' ? currentImage : currentImage.url) : null;

    return (
        <div className="min-h-screen bg-black text-zinc-300 pb-20 selection:bg-emerald-500/20 selection:text-emerald-200">
            <main className="pt-6 sm:pt-8 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto space-y-6">

                {/* Navigation & Status Module */}
                <div className="grid grid-cols-12 gap-6 items-center">
                    <div className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#050505] border border-white/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-hidden">
                            <button
                                onClick={() => router.back()}
                                className="w-8 h-8 shrink-0 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="h-4 w-px bg-white/10 shrink-0" />
                            <div className="flex items-center gap-2 text-sm overflow-hidden">
                                <span className="text-zinc-500 hidden sm:inline">Properties</span>
                                <span className="text-zinc-700 hidden sm:inline">/</span>
                                <span className="text-zinc-100 font-medium truncate">{currentProperty.title || currentProperty.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <TechBadge variant={currentProperty.status === 'active' ? 'success' : currentProperty.status === 'pending' ? 'warning' : 'danger'}>
                                {currentProperty.status}
                            </TechBadge>
                            <div className="text-[10px] text-zinc-600 font-mono">ID: {currentProperty.id.slice(0, 8)}</div>
                        </div>
                    </div>
                </div>

                {/* KYC Offline Reason Notification Banner */}
                {currentProperty.status === 'offline' && (
                    <div className="bg-[#0f0f15] border border-amber-500/20 rounded-lg p-4 relative overflow-hidden flex items-start gap-4">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
                        <div className="p-2 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 text-left">
                            <h4 className="text-sm font-semibold text-zinc-100 font-mono uppercase tracking-wider">
                                Property Status: Offline
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                {kycRecord && kycRecord.kyc_status === 'activated' ? (
                                    "This property has been approved by the admin, but is currently set to Offline (Maintenance Mode) manually by the host."
                                ) : (
                                    "This property has been approved by the admin, but is currently Offline because the host's Banking & KYC verification is pending or incomplete. It will automatically go Live once the host completes the setup in their Banking & KYC tab."
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Hero Grid */}
                <div className="grid grid-cols-12 gap-6 lg:h-[500px]">
                    {/* Main Image - Takes 8 cols */}
                    <div suppressHydrationWarning className="col-span-12 lg:col-span-8 min-h-[350px] lg:min-h-0 relative group rounded-lg overflow-hidden border border-white/10 bg-[#050505]">
                        {currentImageUrl ? (
                            <Image
                                src={currentImageUrl}
                                alt={currentProperty.title || currentProperty.name || 'Property Image'}
                                fill
                                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 grayscale-[20%] group-hover:grayscale-0"
                                priority
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Activity className="w-12 h-12 text-zinc-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />

                        {/* Image Gallery Controls */}
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 z-20 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 max-w-[50%] justify-end">
                                    {displayImages.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                            className={cn(
                                                "h-2 rounded-full transition-all duration-300",
                                                idx === currentImageIndex ? "bg-emerald-500 w-4" : "bg-white/40 hover:bg-white/80 w-2"
                                            )}
                                            aria-label={`View image ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="absolute bottom-0 left-0 p-8 space-y-2 pointer-events-none">
                            <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">{currentProperty.title || currentProperty.name}</h1>
                            <div className="flex items-center gap-4 text-zinc-400 font-mono text-xs pointer-events-auto">
                                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {currentProperty.location}</span>
                                {currentProperty.tier && <span className="flex items-center gap-1.5"><Star className="w-3 h-3" /> {currentProperty.tier} TIER</span>}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - Takes 4 cols */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col lg:grid lg:grid-rows-3 gap-6">
                        {/* Price Card */}
                        <div className="row-span-1 bg-[#050505] border border-white/10 rounded-lg p-6 flex flex-col justify-center hover:border-white/20 transition-colors relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20"><IndianRupee className="w-6 h-6 text-emerald-500" /></div>

                            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 lg:gap-0">
                                <div>
                                    <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2 block">Revenue Potential</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("text-4xl text-white font-medium", mono.className)}>₹{currentProperty.price_per_night || currentProperty.price || 0}</span>
                                        <span className="text-zinc-600 text-sm">/ night</span>
                                    </div>
                                </div>

                                {(currentProperty.weekendPrice || currentProperty.weekend_price_per_night) && (
                                    <div className="text-left lg:text-right pt-2 lg:pt-0 border-t border-white/5 lg:border-t-0">
                                        <span className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider mb-2 block">Weekend</span>
                                        <div className="flex items-baseline gap-1 justify-start lg:justify-end">
                                            <span className={cn("text-2xl text-emerald-400 font-medium", mono.className)}>₹{currentProperty.weekendPrice || currentProperty.weekend_price_per_night}</span>
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
                                    <span className="text-xl text-zinc-200">{currentProperty.capacity || currentProperty.max_guests || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="bg-[#050505] border border-white/10 rounded-lg p-4 flex flex-col justify-center hover:bg-white/5 transition-colors">
                                <span className="text-[10px] text-zinc-500 font-mono uppercase">Bedrooms</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Bed className="w-4 h-4 text-purple-500" />
                                    <span className="text-xl text-zinc-200">{currentProperty.bedrooms}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="row-span-1 bg-[#050505] border border-white/10 rounded-lg p-6 flex flex-col justify-center">
                            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-3">System Actions</span>
                            <div className="flex gap-3">
                                {currentProperty.status !== 'active' && currentProperty.status !== 'offline' && (
                                    <Button onClick={handleApprove} disabled={actionLoading} className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 h-10 rounded text-xs uppercase font-mono tracking-wide">
                                        Approve
                                    </Button>
                                )}
                                {currentProperty.status !== 'rejected' && (
                                    <Button onClick={handleReject} disabled={actionLoading} className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 h-10 rounded text-xs uppercase font-mono tracking-wide">
                                        Reject
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid (Bento) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Description - 2 Cols */}
                    <div className="lg:col-span-2 bg-[#050505] border border-white/10 rounded-lg p-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-20" />
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="w-5 h-5 text-zinc-600" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Property Manifest</h3>
                        </div>
                        <p className="text-zinc-400 leading-relaxed font-light text-sm md:text-base">
                            {currentProperty.description || "No data available."}
                        </p>
                    </div>

                    {/* Metadata - 1 Col */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#050505] border border-white/10 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Cpu className="w-4 h-4 text-zinc-600" />
                                <h3 className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Specs</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Type</span>
                                    <span className="text-zinc-300 font-mono capitalize">{currentProperty.type || currentProperty.tier || (currentProperty as any).property_type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Baths</span>
                                    <span className="text-zinc-300 font-mono">{currentProperty.bathrooms}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-zinc-600">Created</span>
                                    <span suppressHydrationWarning className="text-zinc-300 font-mono">{formatDate(currentProperty.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Host KYC Details Section */}
                <div className="bg-[#050505] border border-indigo-500/20 rounded-lg p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    <div className="absolute -top-10 right-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-sm text-zinc-200 font-semibold uppercase tracking-wider">Host KYC Details</h3>
                                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Banking & verification information</p>
                            </div>
                        </div>
                        {kycRecord ? (
                            (() => {
                                const cfg = kycStatusConfig[kycRecord.kyc_status] || kycStatusConfig.pending;
                                const IconComp = cfg.icon;
                                return (
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.cls}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotCls} animate-pulse`} />
                                        <IconComp className="w-3 h-3" />
                                        {cfg.label}
                                    </span>
                                );
                            })()
                        ) : (
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-zinc-800/60 text-zinc-500 border border-zinc-700">
                                No KYC Submitted
                            </span>
                        )}
                    </div>

                    {kycRecord ? (
                        <div className="space-y-8">
                            {/* KYC Error Banner */}
                            {kycRecord.kyc_error_message && (
                                <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">KYC Error / Clarification Required</p>
                                        <p className="text-sm text-orange-300">{kycRecord.kyc_error_message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Grid of KYC info cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Business Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/8">
                                        <Building2 className="w-3.5 h-3.5 text-zinc-600" />
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Business Info</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Legal Business Name</span>
                                            <p className="text-sm text-zinc-200">{kycRecord.legal_business_name || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">PAN Number</span>
                                            <p className={cn("text-sm text-zinc-200", mono.className)}>{kycRecord.pan_number || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Host Email</span>
                                            <p className="text-sm text-zinc-200 break-all">{kycRecord.host_email || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Phone</span>
                                            <p className="text-sm text-zinc-200">{kycRecord.phone || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/8">
                                        <Landmark className="w-3.5 h-3.5 text-zinc-600" />
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bank Details</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Account Number</span>
                                            <p className={cn("text-sm text-zinc-200", mono.className)}>
                                                {kycRecord.bank_account_number
                                                    ? '••••' + kycRecord.bank_account_number.slice(-4)
                                                    : <span className="text-zinc-600 italic">Not provided</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">IFSC Code</span>
                                            <p className={cn("text-sm text-zinc-200", mono.className)}>{kycRecord.bank_ifsc || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Beneficiary Name</span>
                                            <p className="text-sm text-zinc-200">{kycRecord.bank_beneficiary_name || <span className="text-zinc-600 italic">Not provided</span>}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Razorpay Route */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/8">
                                        <Hash className="w-3.5 h-3.5 text-zinc-600" />
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Razorpay Route</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Linked Account ID</span>
                                            <p className={cn("text-sm text-zinc-300 break-all", mono.className)}>
                                                {kycRecord.razorpay_account_id || <span className="text-zinc-600 italic">Not created</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Route Product ID</span>
                                            <p className={cn("text-sm text-zinc-300 break-all", mono.className)}>
                                                {kycRecord.razorpay_product_id || <span className="text-zinc-600 italic">Not created</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Submitted On</span>
                                            <p suppressHydrationWarning className="text-sm text-zinc-300">
                                                {formatDateTime(kycRecord.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 mb-4">
                                <CreditCard className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">No KYC record found for this host</p>
                            <p className="text-xs text-zinc-700 mt-1 font-mono">host has not submitted banking & KYC details yet</p>
                        </div>
                    )}
                </div>

                {/* Verification Documents Section */}
                <div className="bg-[#050505] border border-white/10 rounded-lg p-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-20" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-500/50" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Verification Documents</h3>
                        </div>
                        <div className="text-[10px] text-zinc-600 font-mono flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 animate-pulse" />
                            EXTERNAL_STORAGE_SYNC: ACTIVE
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {(() => {
                            const pType = String(currentProperty.type || currentProperty.tier || (currentProperty as any).property_type || '').toLowerCase();
                            const isTent = pType === 'tent';
                            const documentsList = isTent ? [
                                { label: 'Aadhaar Card', url: currentProperty.aadhar_url, id: 'aadhar' },
                                { label: 'PAN Card', url: currentProperty.pan_url, id: 'pan' },
                                { label: 'NOC', url: currentProperty.noc_url, id: 'noc' }
                            ] : [
                                { label: 'Property License', url: currentProperty.license_url, id: 'license' },
                                { label: 'Tax Bill', url: currentProperty.tax_bill_url, id: 'tax_bill' },
                                { label: 'Current Utility Bill', url: currentProperty.current_bill_url, id: 'current_bill' }
                            ];
                            return documentsList.map((doc) => (
                            <div key={doc.id} className="relative group/doc">
                                <div className={cn(
                                    "p-6 border rounded-lg transition-all duration-300 flex flex-col items-center text-center gap-4 bg-white/5",
                                    doc.url ? "border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5" : "border-white/5 opacity-50 grayscale"
                                )}>
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center border transition-colors",
                                        doc.url ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-700"
                                    )}>
                                        <FileText className="w-6 h-6" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">{doc.label}</p>
                                        <p className="text-[10px] text-zinc-600 font-mono truncate max-w-[150px]">
                                            {doc.url ? `${doc.id.toUpperCase()}_REV_01.PDF` : 'NULL_OBJECT'}
                                        </p>
                                    </div>

                                    {doc.url ? (
                                        <div className="flex items-center gap-2 mt-2 w-full">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded text-[10px] uppercase font-mono tracking-wider transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> View
                                            </a>
                                            <a
                                                href={doc.url}
                                                download
                                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-500 rounded text-[10px] uppercase font-mono tracking-wider transition-colors"
                                            >
                                                <Download className="w-3 h-3" /> Get
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="py-2 px-3 border border-white/5 rounded text-[10px] uppercase font-mono tracking-wider text-zinc-700 mt-2 w-full">
                                            NOT_PROVIDED
                                        </div>
                                    )}
                                </div>
                            </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Room Configuration & Inventory Section */}
                <div className="bg-[#050505] border border-white/10 rounded-lg p-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
                    <div className="absolute -top-10 right-10 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                <Bed className="w-5 h-5 text-sky-400" />
                            </div>
                            <div>
                                <h3 className="text-sm text-zinc-200 font-semibold uppercase tracking-wider">Room Configuration & Inventory</h3>
                                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Host-defined room types, pricing, and amenities</p>
                            </div>
                        </div>
                    </div>

                    {currentProperty.room_types && currentProperty.room_types.length > 0 ? (
                        <div className="space-y-4">
                            {currentProperty.room_types.map((roomType) => {
                                const isExpanded = !!expandedRoomTypes[roomType];
                                const count = currentProperty.room_type_counts?.[roomType] || 0;
                                const basePrice = currentProperty.room_type_prices?.[roomType] || currentProperty.price_per_night || 0;
                                const weekendPrice = currentProperty.room_type_weekend_prices?.[roomType] || currentProperty.weekend_price_per_night || 0;
                                const amenities = currentProperty.room_type_amenities?.[roomType] || [];

                                return (
                                    <div
                                        key={roomType}
                                        className={cn(
                                            "border rounded-lg transition-all duration-300 overflow-hidden",
                                            isExpanded
                                                ? "bg-white/5 border-sky-500/30"
                                                : "bg-white/[0.02] border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        {/* Header */}
                                        <button
                                            onClick={() => setExpandedRoomTypes(prev => ({
                                                ...prev,
                                                [roomType]: !prev[roomType]
                                            }))}
                                            className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 text-left outline-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 transition-colors duration-300 rounded",
                                                    isExpanded ? "bg-sky-500/20 text-sky-400" : "bg-zinc-800 text-zinc-500"
                                                )}>
                                                    <Bed className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">{roomType}</h4>
                                                    <span className="text-xs text-zinc-500 font-mono">{count} Units configured</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Base Rate:</span>
                                                    <span className={cn("text-sm text-zinc-200 font-semibold", mono.className)}>₹{basePrice}</span>
                                                    <span className="text-[10px] text-zinc-600">/night</span>
                                                </div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[10px] text-emerald-500/70 font-mono uppercase">Weekend:</span>
                                                    <span className={cn("text-sm text-emerald-400 font-semibold", mono.className)}>₹{weekendPrice}</span>
                                                    <span className="text-[10px] text-zinc-600">/night</span>
                                                </div>
                                                <div className={cn(
                                                    "p-1 rounded-full transition-transform duration-300",
                                                    isExpanded ? "rotate-180 bg-sky-500/10 text-sky-400" : "text-zinc-500"
                                                )}>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Content */}
                                        {isExpanded && (
                                            <div className="p-4 border-t border-white/5 bg-black/40 space-y-4">
                                                <div className="space-y-2">
                                                    <span className="block text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Room Specific Amenities</span>
                                                    {amenities.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                            {amenities.map((amenityId: number) => {
                                                                const name = resolveAmenityName(amenityId);
                                                                return (
                                                                    <div
                                                                        key={amenityId}
                                                                        className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 text-xs text-zinc-400"
                                                                    >
                                                                        <div className="w-1 h-1 bg-sky-400 rounded-full" />
                                                                        <span className="truncate" title={name}>{name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-zinc-600 font-mono italic">No room specific amenities configured.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 mb-4">
                                <Bed className="w-8 h-8 text-zinc-650" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-500">No room types configured</p>
                            <p className="text-xs text-zinc-700 mt-1 font-mono">This property functions as a single integrated unit</p>
                        </div>
                    )}
                </div>

                {/* Features & Rules Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Amenities */}
                    <div className="bg-[#050505] border border-white/10 rounded-lg p-6 min-h-[300px]">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-4 h-4 text-yellow-500/50" />
                            <h3 className="text-sm text-zinc-400 font-mono uppercase tracking-wider">Modules (Amenities)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {currentProperty.amenities?.map((amenity, i) => {
                                if (!amenity) return null;
                                const name = typeof amenity === 'string' 
                                    ? amenity 
                                    : typeof amenity === 'number'
                                        ? (AMENITIES.find(a => a.id === amenity)?.name || `Amenity #${amenity}`)
                                        : (amenity as any).name || (AMENITIES.find(a => a.id === Number((amenity as any).id))?.name);
                                if (!name) return null;
                                return (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 text-xs text-zinc-400">
                                        <div className="w-1 h-1 bg-zinc-500 rounded-full" />
                                        {name}
                                    </div>
                                )
                            })}
                            {(!currentProperty.amenities || currentProperty.amenities.filter(Boolean).length === 0) && (
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
                            {currentProperty.rules?.map((rule, i) => {
                                if (!rule || typeof rule !== 'string') return null;
                                return (
                                    <div key={i} className="flex gap-3 text-sm text-zinc-400 p-2 border-l-2 border-zinc-800 hover:border-zinc-600 transition-colors">
                                        <span className="font-mono text-zinc-600">0{i + 1}</span>
                                        {rule}
                                    </div>
                                );
                            })}
                            {(!currentProperty.rules || currentProperty.rules.filter(Boolean).length === 0) && (
                                <span className="text-zinc-700 text-xs font-mono">NO PROTOCOLS DEFINED</span>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default PropertyDetailsClient;
