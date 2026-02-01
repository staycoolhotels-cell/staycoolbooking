import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyApprovalCard from './PropertyApprovalCard';
import { Property } from '@/lib/types';

describe('PropertyApprovalCard', () => {
  const property: Property = {
    id: '1',
    name: 'Test Property',
    location: 'Test Location',
    tier: 'Gold',
    status: 'pending',
    host_id: '123',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'Test description',
    amenities: [],
    images: [],
    price_per_night: 100,
  };

  it('should render the Approve button', () => {
    render(<PropertyApprovalCard property={property} onReview={() => {}} />);
    const approveButton = screen.getByText('Approve');
    expect(approveButton).toBeInTheDocument();
  });
});
