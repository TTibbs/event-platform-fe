import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { EventDetail, UpdateEventParams } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editedEvent, setEditedEvent] = useState<Partial<EventDetail>>({});

  // Fetch event data
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    const fetchEvent = async () => {
      try {
        // Try to get the event - first attempt using draft API
        let response;
        try {
          response = await eventsApi.getDraftEventById(id);
        } catch (err) {
          // If draft API fails, try regular event API
          response = await eventsApi.getEventById(id);
        }

        // Extract the event from the nested structure
        const eventData = response.data.event;
        setEvent(eventData);

        // Initialize edited event with current values
        setEditedEvent(eventData);

        // Check if user can edit this event
        if (isAuthenticated && user && eventData.team_id) {
          checkEditPermission(eventData.team_id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, isAuthenticated, user]);

  // Check if user has permission to edit this event
  const checkEditPermission = async (teamId: number) => {
    if (!user?.id) return;

    try {
      // Check if user is the creator - add detailed logging
      const currentUserId = Number(user.id);
      const eventCreatorId = Number(event?.created_by);

      console.log("Permission check:", {
        currentUserId,
        eventCreatorId,
        isCreator: currentUserId === eventCreatorId,
        currentUsername: user?.username,
        creatorUsername: event?.creator_username,
        eventTitle: event?.title,
      });

      // Check by ID or username
      if (
        currentUserId === eventCreatorId ||
        user.username === event?.creator_username
      ) {
        console.log("User is creator - granting edit permission");
        setCanEdit(true);
        return;
      }

      // Get user details to check global role
      try {
        const userResponse = await usersApi.getUserById(user.id.toString());
        const userData = userResponse.data.user;

        // If user is site admin, they can edit
        if (userData.is_site_admin) {
          console.log("User is site admin - granting edit permission");
          setCanEdit(true);
          return;
        }
      } catch (error) {
        console.error("Failed to check user role:", error);
      }

      // Check team membership role
      try {
        const membershipResponse = await teamsApi.getMemberByUserId(
          user.id.toString()
        );
        const memberships = membershipResponse.data.team_members || [];

        // Check if the user has edit permission in the event's team
        const hasEditPermission = memberships.some(
          (membership: any) =>
            membership.team_id === teamId &&
            ["team_admin", "owner", "organizer", "event_manager"].includes(
              membership.role
            )
        );

        if (hasEditPermission) {
          console.log(
            "User has team role permission - granting edit permission"
          );
          setCanEdit(true);
          return;
        }
      } catch (error) {
        console.error("Failed to check team membership:", error);
      }

      // If we got here, user doesn't have edit permission
      console.log("User does not have edit permission");
      setCanEdit(false);
    } catch (err) {
      console.error("Failed to check edit permissions:", err);
      setCanEdit(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      // Create an object that matches UpdateEventParams type
      const updateParams: UpdateEventParams = {
        title: editedEvent.title,
        description: editedEvent.description,
        location: editedEvent.location,
        start_time: editedEvent.start_time,
        end_time: editedEvent.end_time,
        // Handle null price by setting it to undefined for the API
        price: editedEvent.price !== null ? editedEvent.price : undefined,
        max_attendees: editedEvent.max_attendees,
        status: editedEvent.status as
          | "draft"
          | "published"
          | "cancelled"
          | undefined,
        is_public: editedEvent.is_public,
      };

      await eventsApi.updateEvent(id, updateParams);
      // Refresh event data
      const response = await eventsApi.getEventById(id);
      setEvent(response.data.event);
      setIsEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update event");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Add to Google Calendar function
  const addToGoogleCalendar = () => {
    if (!event) return;

    try {
      // Format dates for Google Calendar URL
      const startTime = new Date(event.start_time)
        .toISOString()
        .replace(/-|:|\.\d+/g, "");
      const endTime = new Date(event.end_time)
        .toISOString()
        .replace(/-|:|\.\d+/g, "");

      // Create Google Calendar URL with event details
      const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        event.title
      )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
        event.description || ""
      )}&location=${encodeURIComponent(
        event.location || ""
      )}&sf=true&output=xml`;

      // Open in new window
      window.open(url, "_blank");

      toast.success("Opening Google Calendar...");
    } catch (error) {
      console.error("Failed to add event to Google Calendar:", error);
      toast.error("Failed to add event to Google Calendar");
    }
  };

  if (isLoading)
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (error)
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>
    );
  if (!event)
    return <div className="container mx-auto px-4 py-8">Event not found</div>;

  // View mode - display event details
  if (!isEditMode) {
    // Debug logging for edit permission check
    console.log("Render conditions for edit button:", {
      canEdit,
      "user?.id": user?.id,
      "event.created_by": event.created_by,
      "user is creator?": user?.id === event.created_by,
      "edit button should show?": canEdit || user?.id === event.created_by,
    });

    return (
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {/* Show edit button if either our permission check says so OR user is the creator */}
          {(canEdit || user?.id === event.created_by) && (
            <button
              onClick={() => setIsEditMode(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
            >
              Edit Event
            </button>
          )}
        </div>

        <div className="bg-card text-card-foreground shadow-md rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            {event.description && <p className="mb-4">{event.description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Start Time:</p>
                <p className="font-medium">{formatDate(event.start_time)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">End Time:</p>
                <p className="font-medium">{formatDate(event.end_time)}</p>
              </div>
              {event.location && (
                <div>
                  <p className="text-muted-foreground">Location:</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Status:</p>
                <p className="font-medium capitalize">{event.status}</p>
              </div>
              {event.price !== undefined && event.price !== null && (
                <div>
                  <p className="text-muted-foreground">Price:</p>
                  <p className="font-medium">${event.price.toFixed(2)}</p>
                </div>
              )}
              {event.max_attendees !== undefined && (
                <div>
                  <p className="text-muted-foreground">Capacity:</p>
                  <p className="font-medium">{event.max_attendees} attendees</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Visibility:</p>
                <p className="font-medium">
                  {event.is_public ? "Public" : "Private"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <Link to="/events" className="text-primary hover:underline">
            ← Back to Events
          </Link>

          <Button
            variant="outline"
            onClick={addToGoogleCalendar}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Add to Google Calendar
          </Button>
        </div>
      </section>
    );
  }

  // Edit mode - show form
  return (
    <section className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card text-card-foreground shadow-md rounded-lg p-6"
      >
        <div className="mb-4">
          <label className="block text-foreground mb-2" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={editedEvent.title || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-background text-foreground"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-foreground mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={editedEvent.description || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-background text-foreground"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-foreground mb-2" htmlFor="start_time">
              Start Time
            </label>
            <input
              id="start_time"
              name="start_time"
              type="datetime-local"
              value={
                editedEvent.start_time
                  ? new Date(editedEvent.start_time).toISOString().slice(0, 16)
                  : ""
              }
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-foreground mb-2" htmlFor="end_time">
              End Time
            </label>
            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              value={
                editedEvent.end_time
                  ? new Date(editedEvent.end_time).toISOString().slice(0, 16)
                  : ""
              }
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-foreground mb-2" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={editedEvent.location || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2" htmlFor="price">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={editedEvent.price || 0}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              className="block text-foreground mb-2"
              htmlFor="max_attendees"
            >
              Maximum Attendees
            </label>
            <input
              id="max_attendees"
              name="max_attendees"
              type="number"
              min="0"
              value={editedEvent.max_attendees || 0}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-foreground mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={editedEvent.status || "draft"}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-background text-foreground"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_public"
              checked={editedEvent.is_public || false}
              onChange={(e) =>
                setEditedEvent((prev) => ({
                  ...prev,
                  is_public: e.target.checked,
                }))
              }
              className="mr-2"
            />
            <span className="text-foreground">Public Event</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
