'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
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
import { format } from 'date-fns';

interface ReviewListProps {
  initialReviews: Review[];
}

const ReviewList = ({ initialReviews }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setReviews((prev) => [...prev, payload.new as Review]);
        } else if (payload.eventType === 'UPDATE') {
          setReviews((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as Review) : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setReviews((prev) => prev.filter((r) => r.id !== (payload.old as Review).id));
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
            <TableHead>Review ID</TableHead>
            <TableHead>Booking ID</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review: Review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.id}</TableCell>
              <TableCell>{review.booking_id}</TableCell>
              <TableCell>{review.rating} / 5</TableCell>
              <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
              <TableCell>{format(new Date(review.created_at), 'MM/dd/yyyy')}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  View
                </Button>
                <Button variant="destructive" size="sm" className="ml-2">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReviewList;
