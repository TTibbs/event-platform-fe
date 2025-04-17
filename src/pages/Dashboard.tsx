import { useState, useEffect } from "react";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import { EventCard } from "@/components/events/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Event } from "@/types/events";

export default function Dashboard() {
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is a member of any team
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (!user?.id) return;

      try {
        const response = await teamsApi.getMemberByUserId(user.id.toString());
        // If we get a successful response, the user is a team member
        setIsTeamMember(!!response.data);
      } catch (err) {
        // If we get an error, user is not a team member
        setIsTeamMember(false);
        // Redirect non-team members to profile page
        navigate("/profile");
      }
    };

    checkTeamMembership();
  }, [user, navigate]);

  useEffect(() => {
    const fetchDraftEvents = async () => {
      if (!isTeamMember) return; // Skip fetching draft events for non-team members

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
  }, [isTeamMember]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!isTeamMember) return; // Skip fetching if not a team member

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

    if (isTeamMember) {
      fetchAllEvents();
    }
  }, [isTeamMember]);

  // If user isn't a team member, they'll be redirected by the useEffect
  // This is just a fallback
  if (!isTeamMember && !loading) {
    return null;
  }

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
        <p>{error.message || "Failed to load draft events"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isTeamMember && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Draft Events</h2>
            <Button
              className="bg-primary hover:bg-primary/90"
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
            <div className="bg-muted border border-border rounded-md p-8 text-center">
              <p className="text-muted-foreground mb-4">
                You don't have any draft events.
              </p>
            </div>
          )}
        </section>
      )}

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
