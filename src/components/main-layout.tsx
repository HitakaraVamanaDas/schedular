
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Home, Tags, CalendarDays, Plus, Settings, LogOut, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useEvents } from '@/hooks/use-events';
import { useLabels } from '@/hooks/use-labels';
import { useAuth } from '@/hooks/use-auth';
import type { Event, Label } from '@/lib/types';
import SchedulePageContent from '@/components/schedule-page-content';
import LabelsPageContent from '@/components/labels-page-content';
import CalendarView from '@/components/calendar-view';
import AddEventForm from '@/components/add-event-form';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/use-countdown';
import { format, parseISO } from 'date-fns';
import { Cake, Bell, AlarmClock, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/use-search';


export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const { addEvent, deleteEvent, updateEvent } = useEvents();
  const { labels, loading: labelsLoading } = useLabels();
  const { signOut } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        !searchQuery
      ) {
        setSearchVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);


  const handleEditClick = (event: Event) => {
    setViewingEvent(null);
    setEditingEvent(event);
    setSheetOpen(true);
  };

  const handleAddClick = () => {
    setEditingEvent(null);
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditingEvent(null);
    }
    setSheetOpen(open);
  };

  const handleDeleteRequest = (eventId: string) => {
    setViewingEvent(null);
    setDeletingEventId(eventId);
  };

  const confirmDelete = () => {
    if (deletingEventId) {
      deleteEvent(deletingEventId);
      setDeletingEventId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingEventId(null);
  };

  const handleViewDetails = (event: Event) => {
    setViewingEvent(event);
  };
  
  const handleEventSubmit = (eventData: Omit<Event, 'id' | 'isCompleted'>) => {
    if (editingEvent) {
      updateEvent({ ...eventData, id: editingEvent.id, isCompleted: editingEvent.isCompleted });
    } else {
      addEvent({ ...eventData, isCompleted: false });
    }
    setSheetOpen(false);
    setEditingEvent(null);
  };

  const getEventLabels = (event: Event): Label[] => {
    if (!event.labelIds || labelsLoading) return [];
    return event.labelIds.map(id => labels.find(l => l.id === id)).filter(Boolean) as Label[];
  }

  const EventDetailsDialog = ({ event }: { event: Event | null }) => {
    const targetDate = event ? parseISO(event.date) : new Date();
    const { days, hours, minutes, seconds } = useCountdown(targetDate);
    const countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    if (!event) return null;

    const eventLabels = getEventLabels(event);
    
    const repeatText = event.repeat === 'about'
      ? `Repeats every ${event.repeatAbout} minutes`
      : event.repeat !== 'none'
      ? `Repeats ${event.repeat}`
      : 'Does not repeat';

    const reminderText = event.reminderValue && event.reminderUnit
      ? `Remind ${event.reminderValue} ${event.reminderUnit} before.`
      : event.reminderEnabled || event.alarm
      ? 'Reminder enabled at time of event.'
      : 'No reminder set.';
  
    return (
      <Dialog open={!!event} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center flex-wrap gap-2">
              <DialogTitle className="text-3xl font-bold">{event.title}</DialogTitle>
              {event.isBirthday && <Cake className="h-5 w-5 text-muted-foreground" />}
              {event.reminderEnabled && <Bell className="h-5 w-5 text-muted-foreground" />}
              {event.alarm && <AlarmClock className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="text-muted-foreground pt-2 space-y-1">
              <DialogDescription>
                {format(parseISO(event.date), 'EEEE, MMMM do, yyyy')} at {format(parseISO(event.date), 'p')}
              </DialogDescription>
              <DialogDescription className="capitalize">
                {repeatText}
              </DialogDescription>
               <DialogDescription className="capitalize">
                {reminderText}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {eventLabels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">LABELS</h3>
                  <div className="flex flex-wrap gap-2">
                      {eventLabels.map(label => (
                          <Badge key={label.id} style={{ backgroundColor: label.color, color: '#fff' }}>
                              {label.name}
                          </Badge>
                      ))}
                  </div>
                </div>
            )}
            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">DESCRIPTION</h3>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{event.description}</p>
              </div>
            )}
             <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">COUNTDOWN</h3>
                <div className="text-center text-lg text-primary font-mono bg-muted p-3 rounded-md">
                    {countdownText}
                </div>
            </div>
          </div>
  
          <DialogFooter className="sm:justify-between flex-row">
            <Button variant="destructive" onClick={() => handleDeleteRequest(event.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => handleEditClick(event)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };


  const renderContent = () => {
    const commonProps = {
      onEditEvent: handleEditClick,
      onDeleteEvent: handleDeleteRequest,
      onViewEvent: handleViewDetails,
    }
    switch (activeTab) {
      case 'labels':
        return <LabelsPageContent {...commonProps} />;
      case 'calendar':
        return <CalendarView {...commonProps} />;
      case 'home':
      default:
        return <SchedulePageContent {...commonProps} />;
    }
  };

  const navItems = [
    { id: 'labels', icon: Tags, label: 'Labels' },
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
       <header className="p-4 pt-8 animate-content-slide-in opacity-0 shrink-0" style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-normal lowercase text-foreground/80 pl-2">schedule</h1>
          <div className="flex flex-1 justify-end items-center gap-0 md:gap-2" ref={searchContainerRef}>
              {!isSearchVisible && (
                <div className="flex items-center gap-0 md:gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSearchVisible(true)}>
                        <Search />
                        <span className="sr-only">Search</span>
                    </Button>
                  <Link href="/labels" onClick={() => setIsNavigating(true)}>
                    <Button variant="ghost" size="icon">
                      <Tags />
                      <span className="sr-only">Labels</span>
                    </Button>
                  </Link>
                  <Link href="/settings" onClick={() => setIsNavigating(true)}>
                    <Button variant="ghost" size="icon">
                      <Settings />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </Link>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <LogOut />
                          <span className="sr-only">Logout</span>
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
                </div>
              )}
            
              {isSearchVisible && (
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              )}
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col overflow-y-auto pb-24">
        {renderContent()}
      </main>

      {/* Floating Add Button */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <Button 
                size="icon" 
                className="fixed bottom-20 right-6 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/80 z-40 animate-content-slide-in opacity-0" 
                style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }} 
                onClick={handleAddClick}
            >
              <Plus className="w-8 h-8 md:w-10 md:h-10" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-screen flex flex-col p-0"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetHeader className="p-4 border-b shrink-0">
              <SheetTitle className="text-3xl md:text-4xl font-light lowercase">{editingEvent ? 'edit event' : 'add event'}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <AddEventForm onEventSubmit={(data) => handleEventSubmit(data)} eventToEdit={editingEvent} />
            </div>
          </SheetContent>
        </Sheet>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50">
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

        <EventDetailsDialog event={viewingEvent} />

        <AlertDialog open={!!deletingEventId} onOpenChange={(open) => !open && cancelDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
