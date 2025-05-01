import { EventCard } from "@/components/events/EventCard";
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
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-4">
      {events.map((event) => (
        <div key={event.id}>
          <EventCard event={event} userId={userId} />
        </div>
      ))}
    </div>
  );
}
