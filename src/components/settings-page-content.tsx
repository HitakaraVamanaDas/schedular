
'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronsUpDown, LogOut, Loader2, Eye, EyeOff, Download, Upload, Music, Trash2, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { FontSwitcher } from '@/components/font-switcher';
import { usePageOrder } from '@/hooks/use-page-order';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SortablePageList from '@/components/sortable-page-list';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useEvents } from '@/hooks/use-events';
import { exportEventsToCSV, importEventsFromCSV } from '@/lib/csv-helper';
import { exportEventsToICS, importEventsFromICS } from '@/lib/ics-helper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTones } from '@/hooks/use-tones';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const nameSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const deleteAccountSchema = z.object({
    confirmation: z.string().refine(val => val === 'delete', {
        message: 'Please type "delete" to confirm.',
    }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

const UpdateProfileDialog = () => {
    const { user, updateUserName, updateUserPassword } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const nameForm = useForm<z.infer<typeof nameSchema>>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: user?.displayName || '' },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    const handleNameUpdate = async (values: z.infer<typeof nameSchema>) => {
        setIsUpdating(true);
        try {
            await updateUserName(values.name);
            toast({ title: 'Success', description: 'Your name has been updated.' });
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePasswordUpdate = async (values: z.infer<typeof passwordSchema>) => {
        setIsUpdating(true);
        try {
            await updateUserPassword(values.currentPassword, values.newPassword);
            toast({ title: 'Success', description: 'Your password has been updated.' });
            passwordForm.reset();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsUpdating(false);
        }
    };
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Update Profile
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Profile</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="name" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="name">Name</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="name" className="pt-4">
                         <Form {...nameForm}>
                            <form onSubmit={nameForm.handleSubmit(handleNameUpdate)} className="space-y-4">
                                <FormField
                                    control={nameForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Update Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your new name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                    <Button type="submit" disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Name
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="password">
                         <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                            <Input type={showCurrentPassword ? 'text' : 'password'} placeholder="Current password" {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                            <Input type={showNewPassword ? 'text' : 'password'} placeholder="New password" {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                            <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm new password" {...field} />
                                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                                    <Button type="submit" variant="secondary" disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Password
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

const DeleteAccountDialog = () => {
    const { deleteUserAccount } = useAuth();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof deleteAccountSchema>>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: { confirmation: '', password: '' },
    });

    const onSubmit = async (values: z.infer<typeof deleteAccountSchema>) => {
        setIsDeleting(true);
        try {
            await deleteUserAccount(values.password);
            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Error', description: error.message });
             setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive-outline" className="w-full">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Your Account</DialogTitle>
                    <DialogDescription>
                        This is a permanent action and cannot be undone. All your data will be erased.
                        To proceed, please type "delete" below and enter your password.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <FormField
                            control={form.control}
                            name="confirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmation</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Type "delete" to confirm' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                    <Input type={showPassword ? 'text' : 'password'} placeholder="Your password" {...field} />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
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
                            <Button type="submit" variant="destructive" disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete My Account
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default function SettingsPageContent() {
  const [isNavigating, setIsNavigating] = useState(false);
  const { pageOrder, setPageOrder, loading: orderLoading } = usePageOrder();
  const { user, signOut, loading: authLoading } = useAuth();
  const { events, addEvent, loading: eventsLoading } = useEvents();
  const { tones, uploadTone, deleteTone, loading: tonesLoading } = useTones();
  const { toast } = useToast();
  
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isAppearanceOpen, setAppearanceOpen] = useState(false);
  const [isPageOrderOpen, setPageOrderOpen] = useState(false);
  const [isDataManagementOpen, setDataManagementOpen] = useState(false);
  const [isAudioOpen, setAudioOpen] = useState(false);
  
  const [importing, setImporting] = useState(false);
  const [uploadingTone, setUploadingTone] = useState<'notification' | 'alarm' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileTypeRef = useRef<'csv' | 'ics'>('csv');
  const toneInputRef = useRef<HTMLInputElement>(null);

  const handleReorder = (newOrder: string[]) => {
    setPageOrder(newOrder);
  };
  
  const handleExport = (type: 'csv' | 'ics') => {
    if (type === 'csv') {
      exportEventsToCSV(events);
      toast({ title: 'Export Successful', description: 'Your events have been downloaded as a CSV file.' });
    } else {
      exportEventsToICS(events);
      toast({ title: 'Export Successful', description: 'Your events have been downloaded as an ICS file.' });
    }
  };

  const handleImportClick = (type: 'csv' | 'ics') => {
    importFileTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImporting(true);
      try {
        const importFunction = importFileTypeRef.current === 'csv' ? importEventsFromCSV : importEventsFromICS;
        const newEvents = await importFunction(file);
        for (const newEvent of newEvents) {
          await addEvent(newEvent);
        }
        toast({ title: 'Import Successful', description: `${newEvents.length} events have been added.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
      } finally {
        setImporting(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleToneUploadClick = (toneType: 'notification' | 'alarm') => {
    setUploadingTone(toneType);
    toneInputRef.current?.click();
  };

  const handleToneFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadingTone) {
      try {
        await uploadTone(uploadingTone, file);
        toast({ title: 'Upload Successful', description: `Your custom ${uploadingTone} tone has been saved.` });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
      } finally {
        if (toneInputRef.current) {
          toneInputRef.current.value = '';
        }
        setUploadingTone(null);
      }
    }
  };

  if (isNavigating || orderLoading || authLoading || eventsLoading || tonesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="windows-loader">
          <div className="wrapper">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center p-4 pt-8 border-b animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}>
        <Link href="/" onClick={() => setIsNavigating(true)}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft />
          </Button>
        </Link>
        <h1 className="text-4xl font-normal lowercase text-foreground/80">settings</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
        <div className="max-w-2xl mx-auto space-y-8">
          <Collapsible open={isAccountOpen} onOpenChange={setAccountOpen}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">Account</h2>
               <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
             <CollapsibleContent className="space-y-6 mt-4 p-4 border rounded-lg">
                <div>
                    <p className="font-semibold text-foreground">{user?.displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <UpdateProfileDialog />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                            <AlertDialogDescription>
                            You will be returned to the login page.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={signOut}>Logout</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <DeleteAccountDialog />
                </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isAppearanceOpen} onOpenChange={setAppearanceOpen}>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-muted-foreground">Appearance</h2>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4 mt-4">
              <ThemeSwitcher />
              <FontSwitcher />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isAudioOpen} onOpenChange={setAudioOpen}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">Audio</h2>
               <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Notification Tone</h3>
                        <p className="text-sm text-muted-foreground">Used for event reminders.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {tones.notification && (
                           <Button variant="ghost" size="icon" onClick={() => deleteTone('notification')}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        )}
                        <Button onClick={() => handleToneUploadClick('notification')} disabled={!!uploadingTone} variant="outline" size="icon">
                            {uploadingTone === 'notification' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            <span className="sr-only">{tones.notification ? 'Replace Tone' : 'Upload Tone'}</span>
                        </Button>
                    </div>
                </div>
                <Separator/>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Alarm Tone</h3>
                        <p className="text-sm text-muted-foreground">Used for event alarms.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {tones.alarm && (
                           <Button variant="ghost" size="icon" onClick={() => deleteTone('alarm')}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        )}
                        <Button onClick={() => handleToneUploadClick('alarm')} disabled={!!uploadingTone} variant="outline" size="icon">
                           {uploadingTone === 'alarm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                           <span className="sr-only">{tones.alarm ? 'Replace Tone' : 'Upload Tone'}</span>
                        </Button>
                    </div>
                </div>
                 <input
                    type="file"
                    ref={toneInputRef}
                    className="hidden"
                    accept="audio/*"
                    onChange={handleToneFileChange}
                  />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isPageOrderOpen} onOpenChange={setPageOrderOpen}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">Page Order</h2>
               <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
             <CollapsibleContent className="space-y-2 mt-4">
               <SortablePageList items={pageOrder} onReorder={handleReorder} />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isDataManagementOpen} onOpenChange={setDataManagementOpen}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-muted-foreground">Data Management</h2>
               <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
             <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button disabled={events.length === 0} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export Events
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={() => handleExport('csv')}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('ics')}>
                        Export as ICS (iCalendar)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={importing} className="w-full">
                        {importing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Import Events
                      </Button>
                    </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={() => handleImportClick('csv')}>
                        Import from CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImportClick('ics')}>
                        Import from ICS (iCalendar)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={importFileTypeRef.current === 'csv' ? '.csv' : '.ics'}
                    onChange={handleFileChange}
                  />
                </div>
                 <p className="text-xs text-muted-foreground text-center">
                    You can export your events to a CSV file or import events from a CSV/ICS file.
                 </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>
    </div>
  );
}
