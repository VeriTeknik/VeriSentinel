import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';

const approvalSchema = z.object({
  comments: z.string().optional()
});

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
  const form = useForm<z.infer<typeof approvalSchema>>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comments: ''
    }
  });

  const handleSubmit = (data: z.infer<typeof approvalSchema>) => {
    onApprove(isApproving, data.comments);
    form.reset();
    onClose();
  };

  const getTitle = () => {
    if (isApproving) {
      switch (approvalType) {
        case 'security': return 'Security Approval';
        case 'technical': return 'Technical Approval';
        case 'business': return 'Business Approval';
      }
    } else {
      switch (approvalType) {
        case 'security': return 'Security Rejection';
        case 'technical': return 'Technical Rejection';
        case 'business': return 'Business Rejection';
      }
    }
  };

  const getDescription = () => {
    if (isApproving) {
      switch (approvalType) {
        case 'security': return 'This confirms the change meets all security requirements and policies.';
        case 'technical': return 'This confirms the change is technically feasible and properly designed.';
        case 'business': return 'This confirms the change aligns with business objectives and requirements.';
      }
    } else {
      return 'Please provide a reason for rejecting this change request.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isApproving ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 mr-2 text-red-500" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isApproving 
                        ? "Optional comments regarding your approval" 
                        : "Please explain why this change request is being rejected"}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} className="mt-4 sm:mt-0">
                Cancel
              </Button>
              <Button 
                type="submit"
                variant={isApproving ? "default" : "destructive"}
              >
                {isApproving ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}