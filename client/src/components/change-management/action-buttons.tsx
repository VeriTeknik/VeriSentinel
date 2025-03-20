import React from 'react';
import { Button } from '@/components/ui/button';
import { ChangeRequest, User } from '@shared/schema';
import { 
  Check, X, Calendar, FileText, ClipboardCheck, Clock, Activity, Shield, Code, Building
} from 'lucide-react';

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
  if (!currentUser) return null;

  // Check if the current user is the requester
  const isRequester = changeRequest.requestedBy === currentUser.id;
  
  // Check if the current user has security approval role
  const hasSecurityRole = ["admin", "ciso", "security_manager"].includes(currentUser.role);
  
  // Check if the current user has technical approval role
  const hasTechnicalRole = ["admin", "cto", "network_admin"].includes(currentUser.role);
  
  // Check if the current user has business approval role
  const hasBusinessRole = ["admin", "ceo", "business_manager"].includes(currentUser.role);
  
  // Check if the current user is an implementer
  const isImplementer = ["admin", "network_admin", "system_admin"].includes(currentUser.role);
  
  // Check if the current user is a controller (can verify)
  const isController = ["admin", "ciso", "auditor"].includes(currentUser.role);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Actions</h3>
      
      <div className="space-y-4">
        {/* Draft stage - Requester can submit for review */}
        {changeRequest.status === 'draft' && isRequester && (
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => onSubmit(changeRequest.id)}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
            <p className="text-sm text-gray-500">
              This will start the approval workflow chain for this change request.
            </p>
          </div>
        )}
        
        {/* Security review stage */}
        {changeRequest.status === 'pending_security_review' && hasSecurityRole && (
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => showApprovalDialog('security')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => showApprovalDialog('security')}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Security approval is required to ensure the change complies with security policies.
            </p>
          </div>
        )}
        
        {/* Technical review stage */}
        {changeRequest.status === 'pending_technical_review' && hasTechnicalRole && (
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => showApprovalDialog('technical')}
              >
                <Code className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => showApprovalDialog('technical')}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Technical approval is required to ensure the change is technically sound and feasible.
            </p>
          </div>
        )}
        
        {/* Business review stage */}
        {changeRequest.status === 'pending_business_review' && hasBusinessRole && (
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => showApprovalDialog('business')}
              >
                <Building className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => showApprovalDialog('business')}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Business approval is required to ensure the change aligns with business objectives.
            </p>
          </div>
        )}
        
        {/* Approved - ready for scheduling */}
        {changeRequest.status === 'approved' && (isRequester || isImplementer) && (
          <div className="flex flex-col space-y-3">
            <Button 
              className="w-full"
              onClick={showScheduleDialog}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Implementation
            </Button>
            <p className="text-sm text-gray-500">
              Schedule the implementation for this approved change request.
            </p>
          </div>
        )}
        
        {/* Scheduled - ready for implementation */}
        {changeRequest.status === 'scheduled' && isImplementer && (
          <div className="flex flex-col space-y-3">
            <Button 
              className="w-full"
              onClick={showImplementDialog}
            >
              <Activity className="mr-2 h-4 w-4" />
              Mark as Implemented
            </Button>
            <p className="text-sm text-gray-500">
              Record that this change has been implemented according to the schedule.
            </p>
          </div>
        )}
        
        {/* Implemented - ready for verification */}
        {changeRequest.status === 'implemented' && isController && (
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-success hover:bg-success/90"
                onClick={showVerifyDialog}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={showVerifyDialog}
              >
                <X className="mr-2 h-4 w-4" />
                Fail Verification
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Verify that the change has been implemented correctly and meets requirements.
            </p>
          </div>
        )}
        
        {/* No actions available - show message */}
        {((changeRequest.status === 'draft' && !isRequester) ||
          (changeRequest.status === 'pending_security_review' && !hasSecurityRole) ||
          (changeRequest.status === 'pending_technical_review' && !hasTechnicalRole) ||
          (changeRequest.status === 'pending_business_review' && !hasBusinessRole) ||
          (changeRequest.status === 'approved' && !(isRequester || isImplementer)) ||
          (changeRequest.status === 'scheduled' && !isImplementer) ||
          (changeRequest.status === 'implemented' && !isController) ||
          changeRequest.status === 'verified' ||
          changeRequest.status === 'closed' ||
          changeRequest.status === 'rejected'
        ) && (
          <div className="p-4 bg-gray-50 rounded-md text-gray-600 border border-gray-200">
            {changeRequest.status === 'verified' && (
              <p>This change request has been successfully verified and completed.</p>
            )}
            {changeRequest.status === 'closed' && (
              <p>This change request has been closed.</p>
            )}
            {changeRequest.status === 'rejected' && (
              <p>This change request has been rejected and no further actions are available.</p>
            )}
            {!['verified', 'closed', 'rejected'].includes(changeRequest.status) && (
              <p>You don't have permission to take action on this change request at its current stage.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}