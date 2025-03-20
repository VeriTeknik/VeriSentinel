import React from 'react';
import { ChangeRequest } from '@shared/schema';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowChainProps {
  changeRequest: ChangeRequest;
}

export function WorkflowChain({ changeRequest }: WorkflowChainProps) {
  // Define the workflow states in order
  const workflowSteps = [
    { id: 'draft', label: 'Draft' },
    { id: 'pending_security_review', label: 'Security Review' },
    { id: 'pending_technical_review', label: 'Technical Review' },
    { id: 'pending_business_review', label: 'Business Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'implemented', label: 'Implemented' },
    { id: 'verified', label: 'Verified' },
    { id: 'closed', label: 'Closed' }
  ];

  // Calculate current step index
  let currentStepIndex = workflowSteps.findIndex(step => step.id === changeRequest.status);
  if (currentStepIndex === -1) {
    // Handle rejected or other special states
    currentStepIndex = 0;
  }

  // Handle special case for rejected status
  const isRejected = changeRequest.status === 'rejected';
  
  // Determine who rejected if applicable
  let rejectedBy = '';
  if (isRejected) {
    if (changeRequest.securityApprovalStatus === 'rejected') rejectedBy = 'Security';
    else if (changeRequest.technicalApprovalStatus === 'rejected') rejectedBy = 'Technical';
    else if (changeRequest.businessApprovalStatus === 'rejected') rejectedBy = 'Business';
    else if (changeRequest.verificationStatus === 'failed') rejectedBy = 'Verification';
  }

  const getStepStatus = (stepIndex: number) => {
    if (isRejected) {
      // If this is the step where rejection happened
      if (
        (stepIndex === 1 && changeRequest.securityApprovalStatus === 'rejected') ||
        (stepIndex === 2 && changeRequest.technicalApprovalStatus === 'rejected') ||
        (stepIndex === 3 && changeRequest.businessApprovalStatus === 'rejected') ||
        (stepIndex === 7 && changeRequest.verificationStatus === 'failed')
      ) {
        return 'rejected';
      }
      // Steps before rejection
      return stepIndex < currentStepIndex ? 'completed' : 'upcoming';
    }
    
    // Normal flow
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Workflow Chain</h3>
      
      {isRejected && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Rejected at {rejectedBy} stage</span>
        </div>
      )}
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200"></div>
        
        {/* Workflow steps */}
        <div className="flex justify-between relative">
          {workflowSteps.map((step, index) => {
            const status = getStepStatus(index);
            
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                {/* Step circle */}
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center", 
                    status === 'completed' && "bg-green-500",
                    status === 'current' && "bg-blue-500",
                    status === 'rejected' && "bg-red-500",
                    status === 'upcoming' && "bg-gray-200"
                  )}
                >
                  {status === 'completed' && <CheckCircle className="h-6 w-6 text-white" />}
                  {status === 'current' && <Clock className="h-6 w-6 text-white" />}
                  {status === 'rejected' && <XCircle className="h-6 w-6 text-white" />}
                  {status === 'upcoming' && <span className="text-gray-500">{index + 1}</span>}
                </div>
                
                {/* Step label */}
                <span 
                  className={cn(
                    "text-xs mt-2 font-medium",
                    status === 'completed' && "text-green-700",
                    status === 'current' && "text-blue-700",
                    status === 'rejected' && "text-red-700",
                    status === 'upcoming' && "text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current stage details */}
      <div className="mt-8">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Stage:</h4>
        {isRejected ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">
              This change request was rejected during the {rejectedBy} review stage.
              {changeRequest.comments && (
                <>
                  <br/>
                  <span className="font-medium mt-1 block">Comments:</span> 
                  {changeRequest.comments}
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700">
              {currentStepIndex === 0 && "This change request is in draft stage and needs to be submitted for review."}
              {currentStepIndex === 1 && "Awaiting security review and approval."}
              {currentStepIndex === 2 && "Awaiting technical review and approval."}
              {currentStepIndex === 3 && "Awaiting business approval."}
              {currentStepIndex === 4 && "Change request has been approved and is ready to be scheduled."}
              {currentStepIndex === 5 && `Change request is scheduled for implementation on ${new Date(changeRequest.scheduledFor || '').toLocaleDateString()}.`}
              {currentStepIndex === 6 && "Change has been implemented and is waiting for verification."}
              {currentStepIndex === 7 && "Change has been verified successfully."}
              {currentStepIndex === 8 && "Change request has been closed."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}