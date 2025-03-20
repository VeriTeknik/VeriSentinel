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

const verifySchema = z.object({
  verificationNotes: z.string().min(10, "Please provide verification details (min 10 characters)")
});

interface VerifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (verified: boolean, verificationNotes: string) => void;
  isApproving: boolean;
}

export function VerifyDialog({ isOpen, onClose, onVerify, isApproving }: VerifyDialogProps) {
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      verificationNotes: ''
    }
  });

  const handleSubmit = (data: z.infer<typeof verifySchema>) => {
    onVerify(isApproving, data.verificationNotes);
    form.reset();
    onClose();
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
            {isApproving ? 'Verify Implementation' : 'Fail Verification'}
          </DialogTitle>
          <DialogDescription>
            {isApproving 
              ? 'Confirm that the change has been implemented correctly and meets all requirements.'
              : 'Record why the implementation verification failed and what needs to be corrected.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="verificationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={isApproving 
                        ? "Describe what you verified and how you confirmed the implementation is correct." 
                        : "Explain what failed verification and what needs to be corrected."}
                      className="min-h-[150px]"
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
                {isApproving ? 'Confirm Verification' : 'Fail Verification'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}