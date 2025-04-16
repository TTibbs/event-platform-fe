import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

// Define Event interface
interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  price: number | null;
  max_attendees: number;
  status: "draft" | "published" | "cancelled";
  event_type: string;
  is_public: boolean;
  team_id: number;
  created_at: string;
  updated_at: string;
  team_name?: string;
  creator_username?: string;
  created_by?: number;
}

// Use the same interface structure from events.ts
interface UpdateEventParams {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  max_attendees?: number;
  status?: "draft" | "published" | "cancelled";
  event_type?: string;
  is_public?: boolean;
  team_id?: number | string;
}

export default function EventDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<Event>>({});

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

        // If user is admin, they can edit
        if (userData.role === "admin") {
          console.log("User is admin - granting edit permission");
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
            ["admin", "owner", "organizer", "event_manager"].includes(
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

  console.log(event);

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
        status: editedEvent.status,
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit Event
            </button>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            {event.description && <p className="mb-4">{event.description}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Start Time:</p>
                <p className="font-medium">{formatDate(event.start_time)}</p>
              </div>
              <div>
                <p className="text-gray-600">End Time:</p>
                <p className="font-medium">{formatDate(event.end_time)}</p>
              </div>
              {event.location && (
                <div>
                  <p className="text-gray-600">Location:</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-medium capitalize">{event.status}</p>
              </div>
              {event.price !== undefined && event.price !== null && (
                <div>
                  <p className="text-gray-600">Price:</p>
                  <p className="font-medium">${event.price.toFixed(2)}</p>
                </div>
              )}
              {event.max_attendees !== undefined && (
                <div>
                  <p className="text-gray-600">Capacity:</p>
                  <p className="font-medium">{event.max_attendees} attendees</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Visibility:</p>
                <p className="font-medium">
                  {event.is_public ? "Public" : "Private"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link to="/events" className="text-blue-500 hover:underline">
          ← Back to Events
        </Link>
      </section>
    );
  }

  // Edit mode - show form
  return (
    <section className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6"
      >
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={editedEvent.title || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={editedEvent.description || ""}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="start_time">
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
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="end_time">
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
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={editedEvent.location || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="price">
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
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="max_attendees">
              Maximum Attendees
            </label>
            <input
              id="max_attendees"
              name="max_attendees"
              type="number"
              min="0"
              value={editedEvent.max_attendees || 0}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={editedEvent.status || "draft"}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
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
            <span className="text-gray-700">Public Event</span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
}
