'use client';

import React, { useState, useEffect } from 'react';
import { Campaign } from '@/lib/types';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface CampaignListProps {
  initialCampaigns: Campaign[];
}

const CampaignList = ({ initialCampaigns }: CampaignListProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);

  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCampaigns((prev) => [...prev, payload.new as Campaign]);
        } else if (payload.eventType === 'UPDATE') {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === payload.new.id ? (payload.new as Campaign) : c))
          );
        } else if (payload.eventType === 'DELETE') {
          setCampaigns((prev) => prev.filter((c) => c.id !== (payload.old as Campaign).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalSpend.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Campaigns Overview</h2>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign: Campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.type}</TableCell>
                <TableCell>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {campaign.start_date ? format(new Date(campaign.start_date), 'MM/dd/yyyy') : '-'}
                </TableCell>
                <TableCell>
                  {campaign.end_date ? format(new Date(campaign.end_date), 'MM/dd/yyyy') : '-'}
                </TableCell>
                <TableCell>₹{campaign.budget?.toLocaleString('en-IN')}</TableCell>
                <TableCell>₹{campaign.spend?.toLocaleString('en-IN')}</TableCell>
                <TableCell>{campaign.conversions?.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignList;
