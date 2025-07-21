
'use client';

import { format, parseISO, isPast } from 'date-fns';
import { Trash2, Edit, Bell, AlarmClock, Cake, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Event, Label } from '@/lib/types';
import { useCountdown } from '@/hooks/use-countdown';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/use-events';
import { cn } from '@/lib/utils';

type EventItemProps = {
  event: Event;
  labels: Label[];
  onDelete: (id: string) => void;
  onEdit: (event: Event) => void;
  onView: (event: Event) => void;
};

export default function EventItem({ event, labels, onDelete, onEdit, onView }: EventItemProps) {
  const { updateEvent } = useEvents();
  const targetDate = parseISO(event.date);
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  const hasHappened = isPast(targetDate);

  const countdownText = hasHappened
    ? 'Event has passed'
    : `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const repeatText = event.repeat === 'about'
    ? `Every ${event.repeatAbout} min`
    : event.repeat

  const eventLabels = event.labelIds?.map(id => labels.find(l => l.id === id)).filter(Boolean) as Label[] || [];

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onView
    updateEvent({ ...event, isCompleted: !event.isCompleted });
  };


  return (
    <div className={cn("flex items-center space-x-4 group px-4", event.isCompleted && "opacity-50")}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7"
        onClick={handleToggleComplete} 
        aria-label={event.isCompleted ? 'Mark as not completed' : 'Mark as completed'}
      >
        <CheckCircle2 className={cn("h-6 w-6 text-muted-foreground hover:text-primary", event.isCompleted && "text-primary fill-primary-foreground")} />
      </Button>

      <div 
        className="flex-1 min-w-0 flex items-center space-x-4 cursor-pointer py-3 border-l pl-4"
        onClick={() => onView(event)}
      >
        <div className="flex flex-col items-center justify-center w-12 text-center">
          <div className="text-xs font-bold uppercase text-primary">{format(parseISO(event.date), 'MMM')}</div>
          <div className="text-2xl font-bold">{format(parseISO(event.date), 'dd')}</div>
          <div className="text-xs text-muted-foreground font-semibold">{format(parseISO(event.date), 'p')}</div>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <p className={cn("text-md font-semibold truncate", event.isCompleted && "line-through")}>{event.title}</p>
                {event.isBirthday && <Cake className="h-4 w-4 text-muted-foreground" />}
                {event.reminderEnabled && <Bell className="h-4 w-4 text-muted-foreground" />}
                {event.alarm && <AlarmClock className="h-4 w-4 text-muted-foreground" />}
            </div>
          {eventLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {eventLabels.map(label => (
                <Badge key={label.id} style={{ backgroundColor: label.color, color: '#fff' }} className="text-xs">
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
          {event.repeat !== 'none' && (
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{repeatText}</p>
          )}
          <p className="text-xs text-primary font-mono mt-0.5">{countdownText}</p>
        </div>
      </div>
      <div className="flex flex-col items-center space-y-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(event); }}>
          <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
          <span className="sr-only">Edit event</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}>
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          <span className="sr-only">Delete event</span>
        </Button>
      </div>
    </div>
  );
}
