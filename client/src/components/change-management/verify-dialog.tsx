import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface VerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (verified: boolean, verificationNotes: string) => void;
  isApproving: boolean;
}

export function VerifyDialog({ isOpen, onClose, onVerify, isApproving }: VerifyDialogProps) {
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<string>('verified');
  
  const handleSubmit = () => {
    onVerify(verificationStatus === 'verified', verificationNotes);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Verify Implementation</DialogTitle>
          <DialogDescription>
            Verify that the change has been correctly implemented and is working as expected.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Verification Status</h3>
            <RadioGroup 
              defaultValue="verified" 
              value={verificationStatus}
              onValueChange={setVerificationStatus}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 border p-3 rounded-md bg-success-50">
                <RadioGroupItem value="verified" id="verified" className="mt-1" />
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label htmlFor="verified" className="font-medium text-success-700 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify and Close
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The change has been implemented correctly and meets all requirements.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 border p-3 rounded-md bg-error-50">
                <RadioGroupItem value="failed" id="failed" className="mt-1" />
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label htmlFor="failed" className="font-medium text-error-700 flex items-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Verification Failed
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The change does not meet requirements or has implementation issues.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Verification Notes</h3>
            <Textarea 
              placeholder={verificationStatus === 'verified'
                ? "Describe how the change was verified..."
                : "Describe why the verification failed and what needs to be fixed..."}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="min-h-[150px]"
              required
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isApproving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isApproving || !verificationNotes.trim()}
            variant={verificationStatus === 'verified' ? 'default' : 'destructive'}
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {verificationStatus === 'verified' 
                  ? 'Confirm and Close' 
                  : 'Submit Verification Failure'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}