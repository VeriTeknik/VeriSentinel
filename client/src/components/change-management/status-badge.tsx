import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', classes: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
      case 'pending_security_review':
        return { label: 'Security Review', classes: 'bg-amber-100 text-amber-800 hover:bg-amber-200' };
      case 'pending_technical_review':
        return { label: 'Technical Review', classes: 'bg-blue-100 text-blue-800 hover:bg-blue-200' };
      case 'pending_business_review':
        return { label: 'Business Review', classes: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' };
      case 'approved':
        return { label: 'Approved', classes: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'scheduled':
        return { label: 'Scheduled', classes: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' };
      case 'implemented':
        return { label: 'Implemented', classes: 'bg-teal-100 text-teal-800 hover:bg-teal-200' };
      case 'verified':
        return { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' };
      case 'closed':
        return { label: 'Closed', classes: 'bg-purple-100 text-purple-800 hover:bg-purple-200' };
      case 'rejected':
        return { label: 'Rejected', classes: 'bg-red-100 text-red-800 hover:bg-red-200' };
      default:
        return { label: status.replace(/_/g, ' '), classes: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const { label, classes } = getStatusDetails(status);

  return (
    <Badge className={cn(classes, className)}>
      {label}
    </Badge>
  );
}