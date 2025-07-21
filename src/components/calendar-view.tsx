
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import MonthYearPicker from '@/components/month-year-picker';
import EventList from '@/components/event-list';
import { Separator } from '@/components/ui/separator';
import { useEvents } from '@/hooks/use-events';
import { useLabels } from '@/hooks/use-labels';
import { format, parseISO, isSameDay } from 'date-fns';
import type { Event, Label } from '@/lib/types';
import { useSearch } from '@/hooks/use-search';

type CalendarViewProps = {
    onEditEvent: (event: Event) => void;
    onDeleteEvent: (eventId: string) => void;
    onViewEvent: (event: Event) => void;
}

export default function CalendarView({ onEditEvent, onDeleteEvent, onViewEvent }: CalendarViewProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { events, loading: eventsLoading } = useEvents();
    const { labels, loading: labelsLoading } = useLabels();
    const { searchQuery } = useSearch();

    const searchFilteredEvents = useMemo(() => {
        if (!searchQuery) return events;
        return events
            .filter(event => 
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    }, [events, searchQuery]);

    useEffect(() => {
        if (searchQuery && searchFilteredEvents.length > 0 && events.length > 0) {
            const firstMatchDate = parseISO(searchFilteredEvents[0].date);
            setDate(firstMatchDate);
        } else if (!searchQuery) {
            // Optional: Reset to today's date when search is cleared
            // setDate(new Date()); 
        }
    }, [searchQuery, searchFilteredEvents, events]);

    const datesWithEvents = useMemo(() => {
        if (eventsLoading) return new Set<Date>();
        
        const eventsToDisplay = searchQuery ? searchFilteredEvents : events;
        const dateSet = new Set<Date>();
        eventsToDisplay.forEach(event => {
            const eventDay = new Date(parseISO(event.date).setHours(0,0,0,0));
            dateSet.add(eventDay);
        });
        
        return dateSet;
    }, [events, searchFilteredEvents, searchQuery, eventsLoading]);

    const selectedDayEvents = useMemo(() => {
        if (!date || eventsLoading) return [];
        
        const sourceEvents = searchQuery ? searchFilteredEvents : events;
        
        return sourceEvents
            .filter(event => isSameDay(parseISO(event.date), date))
            .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    }, [date, events, searchFilteredEvents, searchQuery, eventsLoading]);

    return (
        <div className="w-full max-w-md mx-auto py-8 px-4 animate-content-slide-in">
            <div className="flex flex-col gap-8">
                 <div className="space-y-4">
                    <MonthYearPicker
                        value={date || new Date()}
                        onChange={setDate}
                        fromYear={new Date().getFullYear() - 70}
                        toYear={new Date().getFullYear() + 10}
                    />
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={date}
                        onMonthChange={setDate}
                        className="p-0 border rounded-lg"
                        modifiers={{ hasEvent: Array.from(datesWithEvents) }}
                    />
                </div>

                {date && (selectedDayEvents.length > 0 || (eventsLoading && searchQuery)) && (
                    <>
                        <Separator />
                        <div>
                             <h2 className="text-xl font-semibold text-muted-foreground mb-2 px-4">
                                {searchQuery ? `Results on ${format(date, 'MMMM do')}` : `Events on ${format(date, 'MMMM do')}`}
                            </h2>
                            {eventsLoading ? (
                                <div className="text-center text-muted-foreground py-4 px-4">
                                    <p>Loading events...</p>
                                </div>
                            ) : (
                                <EventList 
                                    events={selectedDayEvents} 
                                    labels={labels} 
                                    onDelete={onDeleteEvent} 
                                    onEdit={onEditEvent} 
                                    onView={onViewEvent} 
                                />
                            )}
                        </div>
                    </>
                )}
                
                {date && selectedDayEvents.length === 0 && !eventsLoading && (
                    <>
                        <Separator />
                        <div className="text-center text-muted-foreground py-4 px-4">
                            <p>{searchQuery ? "No matching events on this day." : "No events scheduled for this day."}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
