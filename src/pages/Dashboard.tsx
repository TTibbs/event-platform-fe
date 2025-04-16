import { useState, useEffect } from "react";
import eventsApi from "@/api/events";
import { EventCard } from "@/components/events/EventCard";
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

export default function Dashboard() {
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDraftEvents = async () => {
      setLoading(true);
      try {
        const response = await eventsApi.getDraftEvents();
        setDraftEvents(response.data.events || []);
      } catch (err: any) {
        setError(
          err instanceof Error
            ? err
            : new Error(err?.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDraftEvents();
  }, []);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const response = await eventsApi.getAllEvents();
        setAllEvents(response.data.events || []);
      } catch (err: any) {
        setError(
          err instanceof Error
            ? err
            : new Error(err?.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAllEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{error.message || "Failed to load draft events"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Draft Events</h2>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/events/create")}
          >
            Create New Event
          </Button>
        </div>

        {draftEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftEvents.map((event) => (
              <EventCard key={event.id} event={event} userId={user?.id} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
            <p className="text-gray-500 mb-4">
              You don't have any draft events.
            </p>
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">All Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.map((event) => (
            <EventCard key={event.id} event={event} userId={user?.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
