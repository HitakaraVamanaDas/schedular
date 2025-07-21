
'use client';

import { useState, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { isThisWeek, isToday, isTomorrow, parseISO, format } from 'date-fns';
import { Plus, Edit, Trash2, Settings, Bell, AlarmClock, Cake, LogOut, Tags } from 'lucide-react';
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
import AddEventForm from '@/components/add-event-form';
import EventList from '@/components/event-list';
import Pivot from '@/components/pivot';
import { useEvents } from '@/hooks/use-events';
import { useCountdown } from '@/hooks/use-countdown';
import { usePageOrder } from '@/hooks/use-page-order';
import { useAuth } from '@/hooks/use-auth';
import type { Event, Label } from '@/lib/types';
import { useLabels } from '@/hooks/use-labels';
import { Badge } from '@/components/ui/badge';


export default function MetroSchedulePageContent() {
  const { events, addEvent, deleteEvent, updateEvent, loading: eventsLoading } = useEvents();
  const { labels, loading: labelsLoading } = useLabels();
  const { pageOrder, loading: orderLoading } = usePageOrder();
  const { signOut } = useAuth();

  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const pivotTitles = useMemo(() => pageOrder.map(p => p === "b'day / Anniversary" ? "b'day / Anniversary" : p), [pageOrder]);

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
  }

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

  const filteredEvents = useMemo(() => {
    const weekStartsOn = 1; // Monday

    const daily = events.filter((e) => e.repeat === 'daily').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const weekly = events.filter((e) => e.repeat === 'weekly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const monthly = events.filter((e) => e.repeat === 'monthly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const yearly = events.filter((e) => e.repeat === 'yearly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    const birthdayEvents = events.filter(e => e.isBirthday);

    const groupEvents = (eventList: Event[]) => {
      const inDay = eventList
        .filter((e) => {
          const eventDate = parseISO(e.date);
          return isToday(eventDate) || isTomorrow(eventDate);
        })
        .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

      const thisWeek = eventList
        .filter((e) => {
          const eventDate = parseISO(e.date);
          return isThisWeek(eventDate, { weekStartsOn }) && !isToday(eventDate) && !isTomorrow(eventDate);
        })
        .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

      const later = eventList
        .filter((e) => {
          const eventDate = parseISO(e.date);
          return !isThisWeek(eventDate, { weekStartsOn }) && !isToday(eventDate) && !isTomorrow(eventDate);
        })
        .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        
      return [
        { title: `In Day (${inDay.length})`, events: inDay },
        { title: `This Week (${thisWeek.length})`, events: thisWeek },
        { title: `Later (${later.length})`, events: later },
      ];
    }
    
    const allGrouped = groupEvents(events);
    const birthdaysGrouped = groupEvents(birthdayEvents);

    return { all: allGrouped, daily, weekly, monthly, yearly, "b'day / Anniversary": birthdaysGrouped };
  }, [events]);

  const pageComponents: { [key: string]: React.ReactNode } = {
    all: <div className="pb-24"><EventList groupedEvents={filteredEvents.all} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} isCollapsible /></div>,
    daily: <div className="pb-24"><EventList events={filteredEvents.daily} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} /></div>,
    weekly: <div className="pb-24"><EventList events={filteredEvents.weekly} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} /></div>,
    monthly: <div className="pb-24"><EventList events={filteredEvents.monthly} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} /></div>,
    yearly: <div className="pb-24"><EventList events={filteredEvents.yearly} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} /></div>,
    "b'day / Anniversary": <div className="pb-24"><EventList groupedEvents={filteredEvents["b'day / Anniversary"]} labels={labels} onDelete={handleDeleteRequest} onEdit={handleEditClick} onView={handleViewDetails} isCollapsible /></div>,
  };

  const handleEventSubmit = (eventData: Omit<Event, 'id'>) => {
    if (editingEvent) {
      updateEvent({ ...eventData, id: editingEvent.id });
    } else {
      addEvent(eventData);
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
  
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRequest(event.id)}>
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

  if (eventsLoading || orderLoading || isNavigating || labelsLoading) {
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
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="flex items-center justify-between p-4 pt-8 animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}>
        <h1 className="text-5xl font-normal lowercase text-foreground/80 pl-2">schedule</h1>
        <div className="flex items-center gap-2">
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
      </header>
      <div className="flex-1 min-h-0 animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
          <Pivot titles={pivotTitles}>
             {pageOrder.map((pageKey) => (
                <Fragment key={pageKey}>
                  {pageComponents[pageKey]}
                </Fragment>
              ))}
          </Pivot>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <Button size="icon" className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/80 animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }} onClick={handleAddClick}>
              <Plus className="w-10 h-10" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-screen flex flex-col"
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <SheetHeader className="p-4">
              <SheetTitle className="text-4xl font-light lowercase">{editingEvent ? 'edit event' : 'add event'}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <AddEventForm onEventSubmit={handleEventSubmit} eventToEdit={editingEvent} />
            </div>
          </SheetContent>
        </Sheet>
        
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
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </main>
  );
}
