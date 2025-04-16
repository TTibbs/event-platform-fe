import { useState, useEffect } from "react";
import eventsApi from "@/api/events";
import { EventsList } from "@/components/events/EventsList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  // Get current user ID (if authenticated)
  const currentUserId = user?.id;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsApi.getAllEvents();
        setEvents(response.data.events || []);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load events");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground">
          Browse and register for upcoming events
        </p>
      </header>

      <div className="flex justify-end mb-4">
        <Button onClick={() => navigate("/events/create")}>Create Event</Button>
      </div>

      <EventsList events={events} userId={currentUserId} />
    </div>
  );
}
