import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "@/components/events/EventForm";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import { Event } from "@/types/events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { user, isSiteAdmin } = useAuth();

  // Check if user has permission to edit this event
  const checkEditPermission = async (event: Event) => {
    if (!user?.id) return false;

    // Site admins can edit any event - immediately return true
    if (isSiteAdmin) return true;

    // Event creators can edit their own events
    if (Number(user.id) === Number(event.created_by)) return true;

    try {
      // Check team role for permission
      const response = await teamsApi.getMemberRoleByUserId(user.id.toString());
      const role = response.data.role;

      // Check if user has appropriate role
      return ["team_admin", "event_manager"].includes(role);
    } catch (err) {
      console.error("Failed to check edit permissions:", err);
      return false;
    }
  };

  useEffect(() => {
    const fetchEventAndCheckPermission = async () => {
      if (!eventId) {
        setError(new Error("No event ID provided"));
        setLoading(false);
        return;
      }

      try {
        const response = await eventsApi.getEventById(eventId);
        const eventData = response.data.event;
        setEvent(eventData);

        // Check if user has permission to edit
        const permission = await checkEditPermission(eventData);
        setHasPermission(permission);
      } catch (err: any) {
        setError(
          err instanceof Error
            ? err
            : new Error(err?.message || "Failed to load event")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndCheckPermission();
  }, [eventId, user?.id, isSiteAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Error</h1>
              <p className="mt-2">{error.message}</p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Event Not Found</h1>
              <p className="mt-2">
                The event you're looking for could not be found.
              </p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-2" />
              <h1 className="text-2xl font-bold text-destructive">
                Permission Denied
              </h1>
              <p className="mt-2">
                You don't have permission to edit this event. Only site admins,
                team admins, event managers, or the event creator can edit this
                event.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate(`/events/${eventId}`)}
              >
                View Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
      <EventForm event={event} isEditing={true} />
    </section>
  );
}
