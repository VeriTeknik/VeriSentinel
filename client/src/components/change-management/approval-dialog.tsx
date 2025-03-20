import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { capitalize } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approved: boolean, comments?: string) => void;
  approvalType: 'security' | 'technical' | 'business';
  isApproving: boolean;
}

export function ApprovalDialog({ 
  isOpen, 
  onClose, 
  onApprove,
  approvalType,
  isApproving
}: ApprovalDialogProps) {
  const [comments, setComments] = useState<string>('');
  const [approvalDecision, setApprovalDecision] = useState<boolean | null>(null);
  
  const handleSubmit = () => {
    if (approvalDecision !== null) {
      onApprove(approvalDecision, comments);
    }
  };
  
  const getTitle = () => {
    return `${capitalize(approvalType)} ${approvalDecision === true ? 'Approval' : approvalDecision === false ? 'Rejection' : 'Review'}`;
  };
  
  const getDescription = () => {
    switch(approvalType) {
      case 'security':
        return 'Evaluate the security implications of this change request.';
      case 'technical':
        return 'Evaluate the technical feasibility and impact of this change request.';
      case 'business':
        return 'Evaluate the business value and impact of this change request.';
      default:
        return 'Provide your review of this change request.';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        {approvalDecision === null ? (
          <div className="flex space-x-4 justify-center py-4">
            <Button 
              variant="outline" 
              className="bg-error-50 text-error-700 hover:bg-error-100 w-28"
              onClick={() => setApprovalDecision(false)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button 
              variant="outline" 
              className="bg-success-50 text-success-700 hover:bg-success-100 w-28"
              onClick={() => setApprovalDecision(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </div>
        ) : (
          <>
            <div className="my-3">
              <p className="mb-2 font-medium">
                {approvalDecision 
                  ? 'Approval Comments (optional)' 
                  : 'Rejection Reason (required)'}
              </p>
              <Textarea 
                placeholder={approvalDecision 
                  ? "Enter any comments or conditions for your approval..." 
                  : "Please explain why this change request is being rejected..."}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[100px]"
                required={!approvalDecision}
              />
            </div>
            
            <DialogFooter className="flex space-x-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setApprovalDecision(null)}
                disabled={isApproving}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isApproving || (!approvalDecision && !comments)}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Submit ${approvalDecision ? 'Approval' : 'Rejection'}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}