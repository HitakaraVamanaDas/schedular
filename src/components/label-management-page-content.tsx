
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Edit, Trash2, Loader2, MoreVertical, Palette } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useLabels } from '@/hooks/use-labels';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Label } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const labelSchema = z.object({
  name: z.string().min(1, { message: 'Label name cannot be empty.' }).max(30, { message: 'Label name is too long.' }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, { message: 'Invalid color format.' }),
});

const PRESET_COLORS = [
    '#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#64748B', '#FACC15', '#6366F1'
];


const LabelForm = ({ label, onFormSubmit }: { label?: Label | null, onFormSubmit: (data: z.infer<typeof labelSchema>) => Promise<void> }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof labelSchema>>({
      resolver: zodResolver(labelSchema),
      defaultValues: {
        name: label?.name || '',
        color: label?.color || PRESET_COLORS[0],
      },
    });

    const onSubmit = async (data: z.infer<typeof labelSchema>) => {
        setIsSubmitting(true);
        try {
            await onFormSubmit(data);
            setDialogOpen(false); // Close dialog on success
            form.reset({ name: '', color: PRESET_COLORS[0] });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {label ? (
                    <button className="w-full text-left">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                    </button>
                ) : (
                    <Button>
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Label
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{label ? 'Edit Label' : 'Create Label'}</DialogTitle>
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
                                            <Input {...field} placeholder="#RRGGBB" className="flex-1" />
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
                                {label ? 'Save Changes' : 'Create Label'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default function LabelManagementPageContent() {
  const { labels, addLabel, updateLabel, deleteLabel, loading } = useLabels();
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  const handleAddLabel = async (data: z.infer<typeof labelSchema>) => {
    try {
        await addLabel(data);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleUpdateLabel = async (id: string, data: z.infer<typeof labelSchema>) => {
    try {
      await updateLabel({ id, ...data });
      toast({ title: 'Success', description: 'Label updated successfully.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDeleteLabel = async () => {
    if (deletingLabel) {
      try {
        await deleteLabel(deletingLabel.id);
      } catch(error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setDeletingLabel(null);
      }
    }
  };

  if (loading || isNavigating) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="windows-loader">
          <div className="wrapper"><span /><span /><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground animate-content-slide-in">
      <header className="flex items-center p-4 pt-8 border-b">
        <Link href="/" onClick={() => setIsNavigating(true)}>
            <Button variant="ghost" size="icon" className="mr-2">
                <ChevronLeft />
            </Button>
        </Link>
        <h1 className="flex-1 text-4xl font-normal lowercase text-foreground/80">Labels</h1>
        <LabelForm onFormSubmit={handleAddLabel} />
      </header>

      <main className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-2">
            {labels.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                    <p>No labels yet.</p>
                    <p className="text-sm">Create one to start organizing your events.</p>
                </div>
            ) : (
                <ul className="divide-y divide-border rounded-lg border">
                {labels.map(label => (
                    <li key={label.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: label.color }}></div>
                            <span className="font-medium">{label.name}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <LabelForm label={label} onFormSubmit={(data) => handleUpdateLabel(label.id, data)} />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingLabel(label)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                ))}
                </ul>
            )}
        </div>
      </main>

        <AlertDialog open={!!deletingLabel} onOpenChange={(open) => !open && setDeletingLabel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{deletingLabel?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this label and remove it from all associated events.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingLabel(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLabel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
