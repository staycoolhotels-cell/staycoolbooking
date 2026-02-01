'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
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

interface PropertyListProps {
  initialProperties: Property[];
}

const PropertyList = ({ initialProperties }: PropertyListProps) => {
  const [properties, setProperties] = useState<Property[]>(initialProperties);

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property: Property) => (
            <TableRow key={property.id}>
              <TableCell>
                <div className="font-medium">{property.name}</div>
                <div className="text-sm text-muted-foreground">{property.id}</div>
              </TableCell>
              <TableCell>{property.location}</TableCell>
              <TableCell>
                <Badge variant={property.status === 'active' ? 'default' : 'destructive'}>
                  {property.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PropertyList;
