import { EventCard } from "@/components/events/EventCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  price: number;
  max_attendees: number;
  status: string;
  event_type: string;
  creator_username: string;
  team_name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  team_id: number;
}

interface EventsListProps {
  events: Event[];
  userId?: string | number;
}

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
