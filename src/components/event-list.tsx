import EventItem from './event-item';
import type { Event, Label } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type EventListProps = {
  events?: Event[];
  groupedEvents?: { title: string; events: Event[] }[];
  labels: Label[];
  onDelete: (id: string) => void;
  onEdit: (event: Event) => void;
  onView: (event: Event) => void;
  isCollapsible?: boolean;
  openGroups?: string[];
  onOpenChange?: (openGroups: string[]) => void;
};

export default function EventList({ events, groupedEvents, labels, onDelete, onEdit, onView, isCollapsible, openGroups, onOpenChange }: EventListProps) {
  if (groupedEvents) {
    if (isCollapsible) {
      const defaultOpenValues = groupedEvents.filter(group => group.events.length > 0).map(group => group.title);
      return (
        <Accordion type="multiple" className="w-full" value={openGroups} onValueChange={onOpenChange}>
          {groupedEvents.map((group) => (
            <AccordionItem value={group.title} key={group.title} className="border-b-0">
              <AccordionTrigger className="text-xl font-semibold text-muted-foreground mb-2 hover:no-underline px-4" disabled={group.events.length === 0}>
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                {group.events.length > 0 ? (
                  <div className="divide-y divide-border border-t border-b">
                    {group.events.map((event) => (
                      <EventItem key={event.id} event={event} labels={labels} onDelete={onDelete} onEdit={onEdit} onView={onView} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No events in this category.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }
    
    return (
      <div>
        {groupedEvents.map((group) =>
          group.events.length > 0 ? (
            <div key={group.title} className="py-4">
              <h2 className="text-xl font-semibold text-muted-foreground mb-2 px-4">{group.title}</h2>
              <div className="divide-y divide-border border-t border-b">
                {group.events.map((event) => (
                  <EventItem key={event.id} event={event} labels={labels} onDelete={onDelete} onEdit={onEdit} onView={onView}/>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No events in this category.</p>;
  }

  return (
    <div className="divide-y divide-border border-t border-b">
      {events.map((event) => (
        <EventItem key={event.id} event={event} labels={labels} onDelete={onDelete} onEdit={onEdit} onView={onView} />
      ))}
    </div>
  );
}
