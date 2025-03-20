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

const implementSchema = z.object({
  implementationNotes: z.string().min(10, "Please provide implementation details (min 10 characters)")
});

interface ImplementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImplement: (implementationNotes: string) => void;
}

export function ImplementDialog({ isOpen, onClose, onImplement }: ImplementDialogProps) {
  const form = useForm<z.infer<typeof implementSchema>>({
    resolver: zodResolver(implementSchema),
    defaultValues: {
      implementationNotes: ''
    }
  });

  const handleSubmit = (data: z.infer<typeof implementSchema>) => {
    onImplement(data.implementationNotes);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Mark Change as Implemented</DialogTitle>
          <DialogDescription>
            Record the details of how this change was implemented.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="implementationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Implementation Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how the change was implemented, including any issues encountered and how they were resolved."
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
              <Button type="submit">
                Mark as Implemented
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}