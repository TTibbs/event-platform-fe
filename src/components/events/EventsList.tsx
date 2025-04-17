import { EventCard } from "@/components/events/EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventsListProps } from "@/types/events";

export function EventsList({ events, userId }: EventsListProps) {
  if (!events.length) {
    return (
      <div className="flex items-center justify-center h-64 border border-border rounded-md bg-muted">
        <p className="text-muted-foreground">No events available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
        {events.map((event) => (
          <div key={event.id}>
            <EventCard event={event} userId={userId} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
