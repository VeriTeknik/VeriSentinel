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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

const scheduleSchema = z.object({
  scheduledFor: z.date({
    required_error: "Implementation date is required",
  }).min(new Date(), {
    message: "Implementation date must be in the future",
  }),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Time must be in 24-hour format (HH:MM)",
  })
});

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledDateTime: string) => void;
}

export function ScheduleDialog({ isOpen, onClose, onSchedule }: ScheduleDialogProps) {
  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      scheduledFor: new Date(Date.now() + 86400000), // Tomorrow
      scheduledTime: '09:00'
    }
  });

  const handleSubmit = (data: z.infer<typeof scheduleSchema>) => {
    // Combine date and time for a complete ISO datetime string
    const [hours, minutes] = data.scheduledTime.split(':');
    const scheduledDateTime = new Date(data.scheduledFor);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    onSchedule(scheduledDateTime.toISOString());
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Change Implementation</DialogTitle>
          <DialogDescription>
            Select a date and time when this change will be implemented.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Implementation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Implementation Time (24h format)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="HH:MM" 
                      {...field}
                      pattern="[0-9]{2}:[0-9]{2}"
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
                Schedule
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}