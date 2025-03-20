import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileCheck, CheckCircle } from 'lucide-react';

interface ImplementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImplement: (implementationNotes: string) => void;
}

export function ImplementDialog({ isOpen, onClose, onImplement }: ImplementDialogProps) {
  const [implementationNotes, setImplementationNotes] = useState<string>('');
  
  const handleSubmit = () => {
    onImplement(implementationNotes);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark as Implemented</DialogTitle>
          <DialogDescription>
            Provide details about how this change request was implemented.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Implementation Notes</h3>
            <Textarea 
              placeholder="Describe the actions taken to implement this change..."
              value={implementationNotes}
              onChange={(e) => setImplementationNotes(e.target.value)}
              className="min-h-[150px]"
              required
            />
          </div>
          
          <div className="border p-3 rounded-md bg-muted/30">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h4 className="font-medium">Implementation Checklist</h4>
                <ul className="mt-2 space-y-1.5 text-sm">
                  <li>- The change has been fully implemented according to specifications</li>
                  <li>- All affected systems are operational</li>
                  <li>- The change has been tested in the production environment</li>
                  <li>- Stakeholders have been notified that the change is complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!implementationNotes.trim()}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            Confirm Implementation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}