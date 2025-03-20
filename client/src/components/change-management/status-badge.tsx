import { Badge } from '@/components/ui/badge';
import { capitalize } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_security_review":
      case "pending_technical_review":
      case "pending_business_review":
        return "bg-warning-100 text-warning-800";
      case "approved":
        return "bg-success-100 text-success-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "implemented":
        return "bg-info-100 text-info-800";
      case "verified":
        return "bg-emerald-100 text-emerald-800";
      case "closed":
        return "bg-purple-100 text-purple-800";
      case "rejected":
        return "bg-error-100 text-error-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_security_review":
        return "Security Review";
      case "pending_technical_review":
        return "Technical Review";
      case "pending_business_review":
        return "Business Review";
      default:
        return capitalize(status.replace(/_/g, ' '));
    }
  };
  
  return (
    <Badge className={`${getBadgeStyle(status)} ${className || ''}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}