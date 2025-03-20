import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WorkflowChain } from './workflow-chain';
import { ActionButtons } from './action-buttons';
import { capitalize } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { ChangeRequest, User } from '@shared/schema';
import { XCircle, CheckCircle } from 'lucide-react';

interface DetailsViewProps {
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

export function DetailsView({
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
}: DetailsViewProps) {
  
  return (
    <div className="space-y-6">
      {/* Workflow Chain Visualization */}
      <WorkflowChain changeRequest={changeRequest} />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Request ID</h3>
          <p className="text-base">CR-{changeRequest.id.toString().padStart(4, '0')}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Title</h3>
          <p className="text-base">{changeRequest.title}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <div className="flex items-center">
            <StatusBadge status={changeRequest.status} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Type</h3>
          <p className="text-base capitalize">{changeRequest.type}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Risk Level</h3>
          <p className="text-base capitalize">{changeRequest.riskLevel}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Requested By</h3>
          <p className="text-base">User {changeRequest.requestedBy}</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
        <p className="text-base">
          {new Date(changeRequest.requestedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500">Description</h3>
        <p className="text-base">{changeRequest.description || "No description provided."}</p>
      </div>
      
      {changeRequest.type === "firewall" && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium">Firewall Change Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Source IP</h4>
              <p className="text-base">{changeRequest.sourceIp || "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Destination IP</h4>
              <p className="text-base">{changeRequest.destinationIp || "Not specified"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Ports/Services</h4>
              <p className="text-base">{changeRequest.portServices || "Not specified"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Action</h4>
              <p className="text-base capitalize">{changeRequest.action || "Not specified"}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Firewall Rules</h4>
            <p className="text-base whitespace-pre-wrap">{changeRequest.firewallRules || "None"}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Approval Status</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Security Approval</h4>
            <Badge className={changeRequest.securityApprovalStatus === "approved" 
              ? "bg-success-100 text-success-800" 
              : changeRequest.securityApprovalStatus === "rejected" 
              ? "bg-error-100 text-error-800" 
              : "bg-gray-100 text-gray-800"}>
              {capitalize(changeRequest.securityApprovalStatus || "pending")}
            </Badge>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Technical Approval</h4>
            <Badge className={changeRequest.technicalApprovalStatus === "approved" 
              ? "bg-success-100 text-success-800" 
              : changeRequest.technicalApprovalStatus === "rejected" 
              ? "bg-error-100 text-error-800" 
              : "bg-gray-100 text-gray-800"}>
              {capitalize(changeRequest.technicalApprovalStatus || "pending")}
            </Badge>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Business Approval</h4>
          <Badge className={changeRequest.businessApprovalStatus === "approved" 
            ? "bg-success-100 text-success-800" 
            : changeRequest.businessApprovalStatus === "rejected" 
            ? "bg-error-100 text-error-800" 
            : "bg-gray-100 text-gray-800"}>
            {capitalize(changeRequest.businessApprovalStatus || "pending")}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium">Implementation Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Scheduled For</h4>
            <p className="text-base">
              {changeRequest.scheduledFor 
                ? new Date(changeRequest.scheduledFor).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : "Not scheduled"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Implementation Status</h4>
            <Badge className={changeRequest.status === "implemented" || changeRequest.status === "verified" || changeRequest.status === "closed"
              ? "bg-success-100 text-success-800" 
              : "bg-gray-100 text-gray-800"}>
              {changeRequest.status === "implemented" || changeRequest.status === "verified" || changeRequest.status === "closed"
                ? "Implemented" 
                : "Not Implemented"}
            </Badge>
          </div>
        </div>
        
        {changeRequest.implementationNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Implementation Notes</h4>
            <p className="text-base whitespace-pre-wrap">{changeRequest.implementationNotes}</p>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Verification Status</h4>
          <Badge className={changeRequest.verificationStatus === "verified" 
            ? "bg-success-100 text-success-800" 
            : changeRequest.verificationStatus === "failed" 
            ? "bg-error-100 text-error-800" 
            : "bg-gray-100 text-gray-800"}>
            {capitalize(changeRequest.verificationStatus || "not verified")}
          </Badge>
        </div>
        
        {changeRequest.verificationNotes && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Verification Notes</h4>
            <p className="text-base whitespace-pre-wrap">{changeRequest.verificationNotes}</p>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <ActionButtons 
        changeRequest={changeRequest}
        currentUser={currentUser}
        onSubmit={onSubmit}
        onSecurityApprove={onSecurityApprove}
        onTechnicalApprove={onTechnicalApprove}
        onBusinessApprove={onBusinessApprove}
        onSchedule={onSchedule}
        onImplement={onImplement}
        onVerify={onVerify}
        showApprovalDialog={showApprovalDialog}
        showScheduleDialog={showScheduleDialog}
        showImplementDialog={showImplementDialog}
        showVerifyDialog={showVerifyDialog}
      />
      
      {(changeRequest.status === "closed" || changeRequest.status === "rejected") && (
        <Alert className={changeRequest.status === "closed" ? "bg-success-50 border-success-100" : "bg-error-50 border-error-100"}>
          <AlertTitle className={changeRequest.status === "closed" ? "text-success-700" : "text-error-700"}>
            {changeRequest.status === "closed" ? "Change Request Completed" : "Change Request Rejected"}
          </AlertTitle>
          <AlertDescription>
            {changeRequest.status === "closed" 
              ? "This change request has been successfully implemented and verified." 
              : "This change request was rejected during the approval process."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}