import { useState, useEffect } from "react";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import { EventsList } from "@/components/events/EventsList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Event } from "@/types/events";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCreateEvent, setCanCreateEvent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  // Get current user ID (if authenticated)
  const currentUserId = user?.id;

  // Check if user can create events (team member with admin or event organiser role)
  useEffect(() => {
    const checkCreateEventPermission = async () => {
      if (!user?.id) {
        setCanCreateEvent(false);
        return;
      }

      try {
        // Check if user is a team member
        const memberResponse = await teamsApi.getMemberByUserId(
          user.id.toString()
        );
        if (!memberResponse.data) {
          // Even if not a team member, check if site admin
          const userResponse = await usersApi.getUserById(user.id.toString());
          const userData = userResponse.data.user;
          if (userData.is_site_admin) {
            setCanCreateEvent(true);
            return;
          }

          setCanCreateEvent(false);
          return;
        }

        // Check user's role
        const roleResponse = await teamsApi.getMemberRoleByUserId(
          user.id.toString()
        );
        const role = roleResponse.data?.role;

        // Allow creating events if site admin, team admin or event organiser
        setCanCreateEvent(role === "team_admin" || role === "event organiser");
      } catch (err) {
        // If error, user can't create events
        setCanCreateEvent(false);
      }
    };

    checkCreateEventPermission();
  }, [user]);

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

      {canCreateEvent && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate("/events/create")}>
            Create Event
          </Button>
        </div>
      )}

      <EventsList events={events} userId={currentUserId} />
    </div>
  );
}
