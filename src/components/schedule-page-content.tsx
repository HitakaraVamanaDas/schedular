
'use client';

import { useState, useMemo, Fragment, useEffect } from 'react';
import { isThisWeek, isToday, isTomorrow, parseISO } from 'date-fns';
import EventList from '@/components/event-list';
import Pivot from '@/components/pivot';
import { useEvents } from '@/hooks/use-events';
import { usePageOrder } from '@/hooks/use-page-order';
import type { Event } from '@/lib/types';
import { useLabels } from '@/hooks/use-labels';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
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
import { useSearch } from '@/hooks/use-search';


type SchedulePageContentProps = {
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (eventId: string) => void;
    onViewEvent: (event: Event) => void;
}

export default function SchedulePageContent({ onEditEvent, onDeleteEvent, onViewEvent }: SchedulePageContentProps) {
  const { events, deleteAllCompletedEvents, loading: eventsLoading } = useEvents();
  const { labels, loading: labelsLoading } = useLabels();
  const { pageOrder, loading: orderLoading } = usePageOrder();
  const { searchQuery } = useSearch();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [openAccordionGroups, setOpenAccordionGroups] = useState<string[]>([]);

  const pivotTitles = useMemo(() => pageOrder.map(p => {
    if (p === "b'day / Anniversary") return "b'day / Anniversary";
    return p;
  }), [pageOrder]);

  const displayedEvents = useMemo(() => {
    if (!searchQuery) return events;
    return events.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const filteredEvents = useMemo(() => {
    const weekStartsOn = 1; // Monday
    const pendingEvents = displayedEvents.filter(e => !e.isCompleted);
    const completedEvents = displayedEvents.filter(e => e.isCompleted).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    const daily = pendingEvents.filter((e) => e.repeat === 'daily').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const weekly = pendingEvents.filter((e) => e.repeat === 'weekly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const monthly = pendingEvents.filter((e) => e.repeat === 'monthly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const yearly = pendingEvents.filter((e) => e.repeat === 'yearly').sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    const birthdayEvents = pendingEvents.filter(e => e.isBirthday);

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
    
    const allGrouped = groupEvents(pendingEvents);
    const birthdaysGrouped = groupEvents(birthdayEvents);

    return { all: allGrouped, daily, weekly, monthly, yearly, "b'day / Anniversary": birthdaysGrouped, completed: completedEvents };
  }, [displayedEvents]);

  useEffect(() => {
    // Set initial open groups, and update if event list changes
    const allGroups = [...filteredEvents.all, ...filteredEvents['b\'day / Anniversary']];
    const openGroupsWithEvents = allGroups.filter(g => g.events.length > 0).map(g => g.title);
    
    setOpenAccordionGroups(prevOpenGroups => {
      // Add new groups with events to the existing state, but don't remove any that the user might have opened manually.
      const newOpenGroups = new Set([...prevOpenGroups, ...openGroupsWithEvents]);
      return Array.from(newOpenGroups);
    });
  }, [filteredEvents.all, filteredEvents['b\'day / Anniversary']]);
  
  const handleClearAllCompleted = () => {
    deleteAllCompletedEvents();
    setClearAllDialogOpen(false);
  };

  const completedPageComponent = (
    <div className="pb-24">
      {filteredEvents.completed.length > 0 && (
        <div className="flex justify-end p-4">
          <Button variant="outline" onClick={() => setClearAllDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}
      <EventList events={filteredEvents.completed} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} />
    </div>
  );

  const pageComponents: { [key: string]: React.ReactNode } = {
    all: <div className="pb-24"><EventList groupedEvents={filteredEvents.all} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} isCollapsible openGroups={openAccordionGroups} onOpenChange={setOpenAccordionGroups} /></div>,
    daily: <div className="pb-24"><EventList events={filteredEvents.daily} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} /></div>,
    weekly: <div className="pb-24"><EventList events={filteredEvents.weekly} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} /></div>,
    monthly: <div className="pb-24"><EventList events={filteredEvents.monthly} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} /></div>,
    yearly: <div className="pb-24"><EventList events={filteredEvents.yearly} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} /></div>,
    "b'day / Anniversary": <div className="pb-24"><EventList groupedEvents={filteredEvents["b'day / Anniversary"]} labels={labels} onDelete={onDeleteEvent} onEdit={onEditEvent} onView={onViewEvent} isCollapsible openGroups={openAccordionGroups} onOpenChange={setOpenAccordionGroups} /></div>,
    completed: completedPageComponent
  };

  if (eventsLoading || orderLoading || isNavigating || labelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
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
    <>
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex-1 min-h-0 animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
          <Pivot titles={pivotTitles}>
             {pageOrder.map((pageKey) => (
                <Fragment key={pageKey}>
                  {pageComponents[pageKey]}
                </Fragment>
              ))}
          </Pivot>
      </div>
    </div>
     <AlertDialog open={isClearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your completed events.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllCompleted} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete All
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
