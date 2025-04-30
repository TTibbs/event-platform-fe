import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { Event } from "@/types/events";

// Component to show both draft and all events (overview)
export function DashboardOverview({
  draftEvents,
  allEvents,
  userId,
}: {
  draftEvents: Event[];
  allEvents: Event[];
  userId?: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Draft Events</h2>
          <Button
            className="bg-primary hover:bg-primary/90 cursor-pointer"
            onClick={() => navigate("/events/create")}
          >
            Create New Event
          </Button>
        </div>

        {draftEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {draftEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userId={userId}
                variant="dashboard"
              />
            ))}
          </div>
        ) : (
          <div className="bg-muted border border-border rounded-md p-8 text-center">
            <p className="text-muted-foreground mb-4">
              You don't have any draft events.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {allEvents.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userId={userId}
              variant="dashboard"
            />
          ))}
        </div>
        {allEvents.length > 3 && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate("/events")}>
              View All Events
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

// Component to show only draft events
export function DraftEventsList({
  events,
  userId,
}: {
  events: Event[];
  userId?: number;
}) {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Draft Events</h2>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => navigate("/events/create")}
        >
          Create New Event
        </Button>
      </div>

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userId={userId}
              variant="dashboard"
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">
            You don't have any draft events.
          </p>
        </div>
      )}
    </div>
  );
}

// Component to show all events
export function AllEventsList({
  events,
  userId,
}: {
  events: Event[];
  userId?: number;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Events</h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userId={userId}
              variant="dashboard"
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">No events found.</p>
        </div>
      )}
    </div>
  );
}
