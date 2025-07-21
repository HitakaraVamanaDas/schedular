
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useEvents } from '@/hooks/use-events';
import { useLabels } from '@/hooks/use-labels';
import type { Event } from '@/lib/types';
import Pivot from '@/components/pivot';
import EventList from '@/components/event-list';
import { isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { useSearch } from '@/hooks/use-search';

type LabelsPageContentProps = {
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (eventId: string) => void;
    onViewEvent: (event: Event) => void;
}

const groupEvents = (eventList: Event[]) => {
    const weekStartsOn = 1; // Monday
    const pendingEvents = eventList.filter(e => !e.isCompleted);
    
    const inDay = pendingEvents
      .filter((e) => {
        const eventDate = parseISO(e.date);
        return isToday(eventDate) || isTomorrow(eventDate);
      })
      .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    const thisWeek = pendingEvents
      .filter((e) => {
        const eventDate = parseISO(e.date);
        return isThisWeek(eventDate, { weekStartsOn }) && !isToday(eventDate) && !isTomorrow(eventDate);
      })
      .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    const later = pendingEvents
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

export default function LabelsPageContent({ onEditEvent, onDeleteEvent, onViewEvent }: LabelsPageContentProps) {
    const { events, loading: eventsLoading } = useEvents();
    const { labels, loading: labelsLoading } = useLabels();
    const { searchQuery } = useSearch();
    const [openAccordionGroups, setOpenAccordionGroups] = useState<string[]>([]);
    
    const pivotTitles = useMemo(() => ['All', ...labels.map(l => l.name)], [labels]);
    
    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events;
        return events.filter(event => 
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [events, searchQuery]);

    const eventsByLabel = useMemo(() => {
        const byLabel: { [labelId: string]: ReturnType<typeof groupEvents> } = {};
        labels.forEach(label => {
            const filtered = filteredEvents.filter(event => event.labelIds?.includes(label.id));
            byLabel[label.id] = groupEvents(filtered);
        });
        return byLabel;
    }, [filteredEvents, labels]);

    const allLabelledEventsGrouped = useMemo(() => {
        const allLabelled = filteredEvents.filter(event => event.labelIds && event.labelIds.length > 0);
        return groupEvents(allLabelled);
    }, [filteredEvents]);

    useEffect(() => {
        const allGroups = [
          ...allLabelledEventsGrouped, 
          ...Object.values(eventsByLabel).flat()
        ];
        const openGroupsWithEvents = allGroups.filter(g => g.events.length > 0).map(g => g.title);
        
        setOpenAccordionGroups(prevOpenGroups => {
            const newOpenGroups = new Set([...prevOpenGroups, ...openGroupsWithEvents]);
            return Array.from(newOpenGroups);
        });
    }, [allLabelledEventsGrouped, eventsByLabel]);

    const loading = eventsLoading || labelsLoading;

    if (loading) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="windows-loader">
              <div className="wrapper"><span /><span /><span /><span /><span /></div>
            </div>
          </div>
        );
    }
    
    if (labels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <p className="text-lg text-muted-foreground mb-4">You don't have any labels yet.</p>
            </div>
        )
    }

    return (
       <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
            <div className="flex-1 min-h-0 animate-content-slide-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
                <Pivot titles={pivotTitles}>
                    <div className="pb-24">
                        <EventList 
                            groupedEvents={allLabelledEventsGrouped} 
                            labels={labels} 
                            onDelete={onDeleteEvent} 
                            onEdit={onEditEvent} 
                            onView={onViewEvent} 
                            isCollapsible
                            openGroups={openAccordionGroups}
                            onOpenChange={setOpenAccordionGroups}
                        />
                    </div>
                    {labels.map(label => (
                        <div key={label.id} className="pb-24">
                           <EventList 
                                groupedEvents={eventsByLabel[label.id]} 
                                labels={labels} 
                                onDelete={onDeleteEvent} 
                                onEdit={onEditEvent} 
                                onView={onViewEvent}
                                isCollapsible
                                openGroups={openAccordionGroups}
                                onOpenChange={setOpenAccordionGroups}
                            />
                        </div>
                    ))}
                </Pivot>
            </div>
        </div>
    );
}
