import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangeRequest, User } from '@shared/schema';
import { WorkflowChain } from './workflow-chain';
import { ActionButtons } from './action-buttons';
import { StatusBadge } from './status-badge';
import { 
  AlertCircle, Calendar, CalendarDays, Clock, FileText, 
  AlertTriangle, Server, Network, Shield 
} from 'lucide-react';
import { capitalize } from '@/lib/utils';

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
  // Format date for display
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'firewall':
        return <Shield className="h-4 w-4 mr-2" />;
      case 'server':
        return <Server className="h-4 w-4 mr-2" />;
      case 'network':
        return <Network className="h-4 w-4 mr-2" />;
      case 'emergency':
        return <AlertCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                {changeRequest.title}
              </CardTitle>
              <div className="flex items-center mt-2 space-x-2">
                <StatusBadge status={changeRequest.status} />
                <div className="flex items-center text-sm text-gray-500">
                  {getTypeIcon(changeRequest.type)}
                  {capitalize(changeRequest.type)} Change
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center bg-amber-50 px-3 py-1 rounded-md">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  {capitalize(changeRequest.riskLevel)} Risk
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-sm">{changeRequest.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">ID</span>
                  <span className="text-sm">CR-{changeRequest.id.toString().padStart(4, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Requested By</span>
                  <span className="text-sm">User #{changeRequest.requestedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Requested At</span>
                  <span className="text-sm">{formatDate(changeRequest.requestedAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Approval Timeline */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Approval Timeline</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Security Approval</span>
                    </div>
                    <div className="ml-6 mt-1 text-sm">
                      {changeRequest.securityApprovalStatus === 'approved' ? (
                        <div className="text-green-600">
                          Approved by User #{changeRequest.securityApproverId} on {formatDate(changeRequest.securityApprovedAt)}
                        </div>
                      ) : changeRequest.securityApprovalStatus === 'rejected' ? (
                        <div className="text-red-600">
                          Rejected by User #{changeRequest.securityApproverId} on {formatDate(changeRequest.securityApprovedAt)}
                        </div>
                      ) : (
                        <div className="text-gray-500">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Server className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Technical Approval</span>
                    </div>
                    <div className="ml-6 mt-1 text-sm">
                      {changeRequest.technicalApprovalStatus === 'approved' ? (
                        <div className="text-green-600">
                          Approved by User #{changeRequest.technicalApproverId} on {formatDate(changeRequest.technicalApprovedAt)}
                        </div>
                      ) : changeRequest.technicalApprovalStatus === 'rejected' ? (
                        <div className="text-red-600">
                          Rejected by User #{changeRequest.technicalApproverId} on {formatDate(changeRequest.technicalApprovedAt)}
                        </div>
                      ) : (
                        <div className="text-gray-500">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Business Approval</span>
                    </div>
                    <div className="ml-6 mt-1 text-sm">
                      {changeRequest.businessApprovalStatus === 'approved' ? (
                        <div className="text-green-600">
                          Approved by User #{changeRequest.businessApproverId} on {formatDate(changeRequest.businessApprovedAt)}
                        </div>
                      ) : changeRequest.businessApprovalStatus === 'rejected' ? (
                        <div className="text-red-600">
                          Rejected by User #{changeRequest.businessApproverId} on {formatDate(changeRequest.businessApprovedAt)}
                        </div>
                      ) : (
                        <div className="text-gray-500">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Implementation</span>
                    </div>
                    <div className="ml-6 mt-1 text-sm">
                      {changeRequest.status === 'scheduled' ? (
                        <div className="text-blue-600">
                          Scheduled for {formatDate(changeRequest.scheduledFor)}
                        </div>
                      ) : changeRequest.status === 'implemented' || changeRequest.status === 'verified' ? (
                        <div className="text-green-600">
                          Implemented by User #{changeRequest.assignedTo} on {formatDate(changeRequest.implementedAt)}
                        </div>
                      ) : (
                        <div className="text-gray-500">Not scheduled</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Firewall-specific fields, displayed only for firewall changes */}
            {changeRequest.type === 'firewall' && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Firewall Change Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Source IP</span>
                    <span className="text-sm">{changeRequest.sourceIp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Destination IP</span>
                    <span className="text-sm">{changeRequest.destinationIp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Port/Services</span>
                    <span className="text-sm">{changeRequest.portServices || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Action</span>
                    <span className="text-sm capitalize">{changeRequest.action || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-500 block">Firewall Rules</span>
                    <pre className="text-sm bg-gray-50 p-2 rounded-md mt-1 overflow-x-auto">
                      {changeRequest.firewallRules || 'No specific rules defined'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            {/* Comments/Notes section */}
            {changeRequest.comments && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{changeRequest.comments}</p>
              </div>
            )}
            
            {changeRequest.implementationNotes && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Implementation Notes</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{changeRequest.implementationNotes}</p>
              </div>
            )}
            
            {changeRequest.verificationNotes && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Verification Notes</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{changeRequest.verificationNotes}</p>
              </div>
            )}
            
            {/* Workflow visualization */}
            <WorkflowChain changeRequest={changeRequest} />
            
            {/* Action buttons based on current status and user role */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}