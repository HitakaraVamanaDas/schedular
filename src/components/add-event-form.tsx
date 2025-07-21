
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { Cake, Loader2, Bell, AlarmClock, Check, ChevronsUpDown, Palette, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import type { Event, ReminderUnit, Label } from '@/lib/types';
import TimePicker from '@/components/time-picker';
import DatePicker from '@/components/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useLabels } from '@/hooks/use-labels';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const reminderUnits: ReminderUnit[] = ['minutes', 'hours', 'days', 'weeks', 'months'];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string({ required_error: 'A time is required.' }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format.'),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'about']),
  repeatAbout: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  reminderEnabled: z.boolean().default(false),
  reminderValue: z.number().min(1).optional(),
  reminderUnit: z.enum(reminderUnits).optional(),
  alarm: z.boolean().default(false),
  isBirthday: z.boolean().default(false),
  remindBefore: z.boolean().default(false),
});

type AddEventFormProps = {
  onEventSubmit: (event: Omit<Event, 'id' | 'isCompleted'>) => void;
  eventToEdit: Event | null;
};


const PRESET_COLORS = [
    '#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#64748B', '#FACC15', '#6366F1'
];

const newLabelSchema = z.object({
  name: z.string().min(1, { message: 'Label name cannot be empty.' }).max(30, { message: 'Label name is too long.' }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { message: 'Invalid color format.' }),
});

const NewLabelDialog = ({ open, onOpenChange, onLabelCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onLabelCreated: (newLabel: Label) => void }) => {
    const { addLabel } = useLabels();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof newLabelSchema>>({
        resolver: zodResolver(newLabelSchema),
        defaultValues: { name: '', color: PRESET_COLORS[0] },
    });

    const onSubmit = async (data: z.infer<typeof newLabelSchema>) => {
        setIsSubmitting(true);
        try {
            const newLabelId = await addLabel(data);
            if(newLabelId) {
                onLabelCreated({ id: newLabelId, ...data });
                toast({ title: 'Success', description: `Label "${data.name}" created.` });
                onOpenChange(false);
                form.reset({ name: '', color: PRESET_COLORS[0] });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Label</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Label Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Work" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Input type="color" {...field} className="p-1 h-10 w-14" />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" type="button">
                                                        <Palette className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-2">
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {PRESET_COLORS.map(color => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                style={{ backgroundColor: color }}
                                                                className="w-8 h-8 rounded-full border"
                                                                onClick={() => form.setValue('color', color, { shouldValidate: true })}
                                                            />
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Input {...field} placeholder="#RRGGBB" className="flex-1" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Label
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function AddEventForm({ onEventSubmit, eventToEdit }: AddEventFormProps) {
  const [isPending, startTransition] = useTransition();
  const { labels, loading: labelsLoading } = useLabels();
  const [isLabelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [isNewLabelDialogOpen, setNewLabelDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      repeat: 'none',
      repeatAbout: '',
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      labelIds: [],
      reminderEnabled: false,
      remindBefore: false,
      reminderValue: 15,
      reminderUnit: 'minutes',
      alarm: false,
      isBirthday: false,
    },
  });

  const resetForm = () => {
    const now = new Date();
    form.reset({
      title: '',
      description: '',
      repeat: 'none',
      repeatAbout: '',
      date: now,
      time: format(now, 'HH:mm'),
      labelIds: [],
      reminderEnabled: false,
      remindBefore: false,
      reminderValue: 15,
      reminderUnit: 'minutes',
      alarm: false,
      isBirthday: false,
    });
  }

  useEffect(() => {
    if (eventToEdit) {
      const eventDate = parseISO(eventToEdit.date);
      form.reset({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: eventDate,
        time: format(eventDate, 'HH:mm'),
        repeat: eventToEdit.repeat,
        repeatAbout: eventToEdit.repeatAbout ?? '',
        labelIds: eventToEdit.labelIds ?? [],
        reminderEnabled: eventToEdit.reminderEnabled,
        remindBefore: !!eventToEdit.reminderValue,
        reminderValue: eventToEdit.reminderValue,
        reminderUnit: eventToEdit.reminderUnit,
        alarm: eventToEdit.alarm,
        isBirthday: eventToEdit.isBirthday,
      });
    } else {
      resetForm();
    }
  }, [eventToEdit, form]);

  const repeatValue = form.watch('repeat');
  const isBirthdayValue = form.watch('isBirthday');
  const reminderEnabledValue = form.watch('reminderEnabled');
  const alarmValue = form.watch('alarm');
  const remindBeforeValue = form.watch('remindBefore');
  
  useEffect(() => {
    const checkReminderFields = () => {
        if (remindBeforeValue) {
            if (!form.getValues('reminderValue')) {
                form.setError('reminderValue', { type: 'manual', message: 'Value is required.' });
            } else {
                form.clearErrors('reminderValue');
            }
            if (!form.getValues('reminderUnit')) {
                form.setError('reminderUnit', { type: 'manual', message: 'Unit is required.' });
            } else {
                form.clearErrors('reminderUnit');
            }
        } else {
            form.clearErrors('reminderValue');
            form.clearErrors('reminderUnit');
        }
    };
    checkReminderFields();
  }, [remindBeforeValue, form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (remindBeforeValue) {
      if (!values.reminderValue) {
        form.setError('reminderValue', { type: 'custom', message: 'Value is required.' });
        return;
      }
      if (!values.reminderUnit) {
        form.setError('reminderUnit', { type: 'custom', message: 'Unit is required.' });
        return;
      }
    }

    startTransition(() => {
      const [hours, minutes] = values.time.split(':').map(Number);
      const combinedDateTime = new Date(values.date);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      onEventSubmit({
        ...values,
        date: combinedDateTime.toISOString(),
        reminderValue: remindBeforeValue ? (values.reminderValue || 15) : undefined,
        reminderUnit: remindBeforeValue ? (values.reminderUnit || 'minutes') : undefined,
      });
      resetForm();
    });
  };

  const handleBirthdayToggle = () => {
    form.setValue('isBirthday', !form.getValues('isBirthday'));
  };

  const timeValue = form.watch('time');
  const dateValue = form.watch('date');

  useEffect(() => {
    if (timeValue && dateValue) {
        const [h, m] = timeValue.split(':').map(Number);
        const newDate = new Date(dateValue);

        if (newDate.getHours() !== h || newDate.getMinutes() !== m) {
          newDate.setHours(h, m, 0, 0);
          form.setValue('date', newDate, { shouldValidate: true, shouldDirty: true });
        }
    }
  }, [timeValue, dateValue, form]);

  const selectedLabelIds = form.watch('labelIds') || [];
  const selectedLabels = labels.filter(l => selectedLabelIds.includes(l.id));

  const filteredLabels = labels.filter(label => label.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input placeholder="Event title" {...field} />
                   <Button
                    type="button"
                    size="icon"
                    variant={isBirthdayValue ? 'secondary' : 'outline'}
                    onClick={handleBirthdayToggle}
                  >
                    <Cake className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the event..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="labelIds"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Labels</FormLabel>
              <Popover open={isLabelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between h-auto min-h-10",
                        !field.value?.length && "text-muted-foreground"
                      )}
                    >
                      <div className="flex gap-1 flex-wrap">
                        {selectedLabels.length > 0 ? (
                           selectedLabels.map(label => (
                             <Badge key={label.id} variant="secondary" style={{ backgroundColor: label.color, color: '#fff' }} className="mr-1">
                               {label.name}
                             </Badge>
                           ))
                        ) : (
                          "Assign Labels"
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search labels..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {labelsLoading ? "Loading..." : "No labels found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setLabelPopoverOpen(false);
                            setNewLabelDialogOpen(true);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create new label
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        {filteredLabels.map((label) => {
                          const isSelected = selectedLabelIds.includes(label.id);
                          return (
                            <CommandItem
                              key={label.id}
                              value={label.name}
                              onSelect={() => {
                                const newSelection = isSelected
                                  ? selectedLabelIds.filter((id) => id !== label.id)
                                  : [...selectedLabelIds, label.id];
                                form.setValue("labelIds", newSelection, { shouldDirty: true });
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <Check className={cn("h-4 w-4")} />
                              </div>
                              <span style={{ color: label.color }}>{label.name}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <NewLabelDialog
            open={isNewLabelDialogOpen}
            onOpenChange={setNewLabelDialogOpen}
            onLabelCreated={(newLabel) => {
                const newSelection = [...selectedLabelIds, newLabel.id];
                form.setValue("labelIds", newSelection, { shouldDirty: true });
            }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                 <FormControl>
                   <DatePicker
                      value={field.value}
                      onChange={(newDate) => {
                          if (form.getValues('time')) {
                            const [h, m] = form.getValues('time').split(':').map(Number);
                            if (newDate) newDate.setHours(h,m, 0, 0);
                          }
                          field.onChange(newDate);
                      }}
                      fromYear={new Date().getFullYear() - 70}
                      toYear={new Date().getFullYear() + 10}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Time</FormLabel>
                <FormControl>
                   <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      date={form.getValues('date')}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="repeat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeat</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repeat frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="about">repeat about...</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           {repeatValue === 'about' && (
            <FormField
              control={form.control}
              name="repeatAbout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeat every (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex rounded-lg border">
             <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                <FormItem className="flex flex-1 flex-row items-center justify-between p-4">
                    <FormLabel htmlFor="reminder-switch">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Reminder</span>
                    </FormLabel>
                    <FormControl>
                    <Switch
                        id="reminder-switch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                </FormItem>
                )}
            />
            <div className="w-px bg-border h-auto" />
            <FormField
                control={form.control}
                name="alarm"
                render={({ field }) => (
                <FormItem className="flex flex-1 flex-row items-center justify-between p-4">
                    <FormLabel htmlFor="alarm-switch">
                    <AlarmClock className="h-5 w-5" />
                    <span className="sr-only">Alarm</span>
                    </FormLabel>
                    <FormControl>
                    <Switch
                        id="alarm-switch"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                </FormItem>
                )}
            />
        </div>

        {(reminderEnabledValue || alarmValue) && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="remindBefore"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Remind Before
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {remindBeforeValue && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name="reminderValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 15"
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reminderUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reminderUnits.map(unit => (
                              <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {eventToEdit ? 'Update Event' : 'Add Event'}
        </Button>
      </form>
    </Form>
  );
}

    
