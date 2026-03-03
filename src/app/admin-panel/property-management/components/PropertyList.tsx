'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { approveProperty, rejectProperty } from '@/lib/admin-actions';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';

interface PropertyListProps {
  initialProperties: Property[];
}

const PropertyList = ({ initialProperties }: PropertyListProps) => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRowClick = (propertyId: string) => {
    router.push(`/admin-panel/property-management/${propertyId}`);
  };

  useEffect(() => {
    setProperties(initialProperties);
  }, [initialProperties]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProperties((prev) => [...prev, payload.new as Property]);
        } else if (payload.eventType === 'UPDATE') {
          setProperties((prev) =>
            prev.map((p) => (p.id === payload.new.id ? (payload.new as Property) : p))
          );
        } else if (payload.eventType === 'DELETE') {
          setProperties((prev) => prev.filter((p) => p.id !== (payload.old as Property).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (propertyId: string) => {
    setLoading(propertyId);
    try {
      // Use server action with service_role privileges
      const result = await approveProperty(propertyId);

      if (!result) {
        throw new Error('Failed to approve property');
      }

      // Update local state optimistically
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'active' } : p))
      );
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Failed to approve property');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (propertyId: string) => {
    setLoading(propertyId);
    try {
      // Use server action with service_role privileges
      const result = await rejectProperty(propertyId, 'Rejected by admin');

      if (!result) {
        throw new Error('Failed to reject property');
      }

      // Update local state optimistically
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: 'rejected' } : p))
      );
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Failed to reject property');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      pending: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      rejected: { variant: 'destructive', className: '' },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const renderPropertyTable = (filteredProperties: Property[]) => (
    <div className="border border-white/10 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-white/5">
            <TableHead className="text-zinc-400">Property</TableHead>
            <TableHead className="text-zinc-400">Location</TableHead>
            <TableHead className="text-zinc-400">Price</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProperties.length === 0 ? (
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                No properties found
              </TableCell>
            </TableRow>
          ) : (
            filteredProperties.map((property: Property) => (
              <TableRow
                key={property.id}
                onClick={() => handleRowClick(property.id)}
                className="cursor-pointer border-white/10 hover:bg-white/5 transition-colors"
              >
                <TableCell>
                  <div className="font-heading font-medium text-zinc-200">{property.title || property.name}</div>
                  <div className="text-sm text-zinc-500">{property.id}</div>
                </TableCell>
                <TableCell className="text-zinc-300">{property.location}</TableCell>
                <TableCell className="text-zinc-300">₹{property.price_per_night}/night</TableCell>
                <TableCell>{getStatusBadge(property.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {property.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(property.id);
                          }}
                          disabled={loading === property.id}
                          className="text-emerald-400 border-emerald-400/20 hover:text-emerald-300 hover:bg-emerald-400/10 hover:border-emerald-400/30 bg-transparent"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(property.id);
                          }}
                          disabled={loading === property.id}
                          className="text-rose-400 border-rose-400/20 hover:text-rose-300 hover:bg-rose-400/10 hover:border-rose-400/30 bg-transparent"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {property.status === 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(property.id);
                        }}
                        disabled={loading === property.id}
                        className="text-emerald-400 border-emerald-400/20 hover:text-emerald-300 hover:bg-emerald-400/10 hover:border-emerald-400/30 bg-transparent"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {property.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(property.id);
                        }}
                        className="text-zinc-300 border-white/10 hover:text-white hover:bg-white/10 bg-transparent"
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const activeProperties = properties.filter((p) => p.status === 'active');
  const rejectedProperties = properties.filter((p) => p.status === 'rejected');

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="all">
          All ({properties.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending ({pendingProperties.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Active ({activeProperties.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejectedProperties.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        {renderPropertyTable(properties)}
      </TabsContent>

      <TabsContent value="pending">
        {renderPropertyTable(pendingProperties)}
      </TabsContent>

      <TabsContent value="active">
        {renderPropertyTable(activeProperties)}
      </TabsContent>

      <TabsContent value="rejected">
        {renderPropertyTable(rejectedProperties)}
      </TabsContent>
    </Tabs>
  );
};

export default PropertyList;
