import { Button } from '@/components/ui/button';
import { XCircle, CheckCircle, CalendarDays, FileCheck, ClipboardCheck } from 'lucide-react';
import { ChangeRequest, User } from '@shared/schema';

interface ActionButtonsProps {
  changeRequest: ChangeRequest;
  currentUser: User | null;
  onSubmit: (id: number) => void;
  onSecurityApprove: (id: number, approved: boolean, comments?: string) => void;
  onTechnicalApprove: (id: number, approved: boolean, comments?: string) => void;
  onBusinessApprove: (id: number, approved: boolean, comments?: string) => void;
  onSchedule: (id: number, scheduledFor: string) => void;
  onImplement: (id: number, implementationNotes?: string) => void;
  onVerify: (id: number, verified: boolean, verificationNotes?: string) => void;
  showApprovalDialog: (type: 'security' | 'technical' | 'business') => void;
  showScheduleDialog: () => void;
  showImplementDialog: () => void;
  showVerifyDialog: () => void;
}

export function ActionButtons({
  changeRequest,
  currentUser,
  onSubmit,
  onSecurityApprove,
  onTechnicalApprove,
  onBusinessApprove,
  onSchedule,
  onImplement,
  onVerify,
  showApprovalDialog,
  showScheduleDialog,
  showImplementDialog,
  showVerifyDialog
}: ActionButtonsProps) {
  
  return (
    <div className="flex justify-end space-x-3 pt-4 border-t">
      {/* Submit for review - Draft stage */}
      {changeRequest.status === "draft" && currentUser && changeRequest.requestedBy === currentUser.id && (
        <Button variant="outline" onClick={() => onSubmit(changeRequest.id)}>
          Submit for Review
        </Button>
      )}
      
      {/* Security approval buttons */}
      {changeRequest.status === "pending_security_review" && currentUser && currentUser.role === "security_admin" && (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-error-50 text-error-700 hover:bg-error-100" 
            onClick={() => showApprovalDialog('security')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            variant="outline" 
            className="bg-success-50 text-success-700 hover:bg-success-100"
            onClick={() => showApprovalDialog('security')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
      
      {/* Technical approval buttons */}
      {changeRequest.status === "pending_technical_review" && currentUser && currentUser.role === "network_admin" && (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-error-50 text-error-700 hover:bg-error-100" 
            onClick={() => showApprovalDialog('technical')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            variant="outline" 
            className="bg-success-50 text-success-700 hover:bg-success-100"
            onClick={() => showApprovalDialog('technical')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
      
      {/* Business approval buttons */}
      {changeRequest.status === "pending_business_review" && currentUser && currentUser.role === "business_owner" && (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="bg-error-50 text-error-700 hover:bg-error-100" 
            onClick={() => showApprovalDialog('business')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            variant="outline" 
            className="bg-success-50 text-success-700 hover:bg-success-100"
            onClick={() => showApprovalDialog('business')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      )}
      
      {/* Schedule implementation button */}
      {changeRequest.status === "approved" && currentUser && currentUser.role === "change_manager" && (
        <Button 
          variant="default" 
          onClick={showScheduleDialog}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Schedule Implementation
        </Button>
      )}
      
      {/* Implement button */}
      {changeRequest.status === "scheduled" && currentUser && (currentUser.role === "implementer" || currentUser.role === "network_admin") && (
        <Button 
          variant="default" 
          onClick={showImplementDialog}
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Mark as Implemented
        </Button>
      )}
      
      {/* Verify implementation buttons */}
      {changeRequest.status === "implemented" && currentUser && currentUser.role === "verifier" && (
        <Button 
          variant="default" 
          onClick={showVerifyDialog}
        >
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Verify Implementation
        </Button>
      )}
    </div>
  );
}