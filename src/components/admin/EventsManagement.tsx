import { useState, useEffect } from "react";
import { Event, CreateEventParams, UpdateEventParams } from "@/types/events";
import { Calendar, EyeIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import { toast } from "sonner";
import ManagementBase from "./ManagementBase";

interface EventsManagementProps {
  events: Event[];
  totalEvents?: number;
  draftEventsCount?: number;
}

export default function EventsManagement({
  events: initialEvents,
  totalEvents: initialTotalEvents,
  draftEventsCount: initialDraftEventsCount,
}: EventsManagementProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [totalEvents, setTotalEvents] = useState<number>(
    initialTotalEvents || initialEvents.length
  );
  const [draftEventsCount, setDraftEventsCount] = useState<number>(
    initialDraftEventsCount || 0
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // New event default state
  const defaultEventState = {
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
    price: 0,
    max_attendees: 100,
    team_id: 0,
    status: "draft" as "draft" | "published" | "cancelled",
    is_public: true,
    event_type: "workshop",
  };

  const [newEvent, setNewEvent] =
    useState<CreateEventParams>(defaultEventState);
  const [editedEvent, setEditedEvent] = useState<UpdateEventParams>({
    ...defaultEventState,
  });

  // Fetch teams for the dropdown
  const fetchTeams = async () => {
    try {
      const response = await teamsApi.getAllTeams();
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load teams");
    }
  };

  // Call fetchTeams when the component mounts
  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch the total count from the admin dashboard if not provided
  useEffect(() => {
    const fetchTotalCounts = async () => {
      if (initialTotalEvents && initialDraftEventsCount !== undefined) {
        return; // If counts are already provided, don't fetch
      }

      try {
        const response = await usersApi.getAdminDashboardData();
        const { total_events, draft_events } = response.data.data;
        setTotalEvents(total_events);
        setDraftEventsCount(draft_events?.length || 0);
      } catch (error: unknown) {
        console.error("Failed to fetch event counts:", error);
      }
    };

    fetchTotalCounts();
  }, [initialTotalEvents, initialDraftEventsCount]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toISOString().slice(0, 16);
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: ["price", "max_attendees", "team_id"].includes(name)
        ? Number(value)
        : value,
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditedEvent((prev) => ({
      ...prev,
      [name]: ["price", "max_attendees", "team_id"].includes(name)
        ? Number(value)
        : value,
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setNewEvent((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleEditCheckboxChange = (name: string, checked: boolean) => {
    setEditedEvent((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateForm = (data: CreateEventParams | UpdateEventParams) => {
    const errors: Record<string, string> = {};

    if (!data.title || !data.title.trim()) {
      errors.title = "Title is required";
    }

    if (!data.start_time) {
      errors.start_time = "Start time is required";
    }

    if (!data.end_time) {
      errors.end_time = "End time is required";
    } else if (
      data.start_time &&
      new Date(data.start_time) >= new Date(data.end_time)
    ) {
      errors.end_time = "End time must be after start time";
    }

    if (!data.team_id) {
      errors.team_id = "Team is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEvent = () => {
    setNewEvent(defaultEventState);
    setFormErrors({});
    setDialogOpen(true);
  };

  const addEvent = async () => {
    if (!validateForm(newEvent)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await eventsApi.createEvent(newEvent);
      const createdEvent = response.data.event;

      // Add team name for display
      const teamName =
        teams.find((t) => t.id === newEvent.team_id)?.name || "Unknown Team";

      // Update events list with the new event
      setEvents((prevEvents) => [
        ...prevEvents,
        {
          ...createdEvent,
          team_name: teamName,
        },
      ]);

      // Update counts based on event status
      if (newEvent.status === "published") {
        setTotalEvents((prev) => prev + 1);
      } else if (newEvent.status === "draft") {
        setDraftEventsCount((prev) => prev + 1);
      }

      setDialogOpen(false);
      setNewEvent(defaultEventState);
      toast.success(`Event "${createdEvent.title}" created successfully`);
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to create event"
          : "Failed to create event";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (event: Event) => {
    setEventToEdit(event);

    // Convert event to UpdateEventParams format with proper typing
    setEditedEvent({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      start_time: formatDateTime(event.start_time),
      end_time: formatDateTime(event.end_time),
      price: event.price || 0,
      max_attendees: event.max_attendees || 100,
      team_id: event.team_id,
      status: event.status as "draft" | "published" | "cancelled",
      is_public: event.is_public,
      event_type: event.event_type,
    });

    setFormErrors({});
    setEditDialogOpen(true);
  };

  const updateEvent = async () => {
    if (!eventToEdit || !validateForm(editedEvent)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if status is changing (for count updates)
      const oldStatus = eventToEdit.status;
      const newStatus = editedEvent.status;
      const statusChanged = oldStatus !== newStatus;

      // Optimistically update the UI
      const teamName =
        teams.find((t) => t.id === editedEvent.team_id)?.name ||
        eventToEdit.team_name;

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventToEdit.id
            ? {
                ...event,
                ...editedEvent,
                team_id:
                  typeof editedEvent.team_id === "string"
                    ? parseInt(editedEvent.team_id, 10)
                    : editedEvent.team_id || event.team_id,
                team_name: teamName,
              }
            : event
        )
      );

      // Update counts if status changed
      if (statusChanged) {
        if (oldStatus === "published" && newStatus === "draft") {
          setTotalEvents((prev) => Math.max(0, prev - 1));
          setDraftEventsCount((prev) => prev + 1);
        } else if (oldStatus === "draft" && newStatus === "published") {
          setTotalEvents((prev) => prev + 1);
          setDraftEventsCount((prev) => Math.max(0, prev - 1));
        }
      }

      // Make the API call
      await eventsApi.updateEvent(eventToEdit.id.toString(), editedEvent);

      setEditDialogOpen(false);
      setEventToEdit(null);
      toast.success(`Event "${editedEvent.title}" updated successfully`);
    } catch (error: unknown) {
      // Revert optimistic update on error
      setEvents(initialEvents);

      // Revert count changes
      setTotalEvents(initialTotalEvents || initialEvents.length);
      setDraftEventsCount(initialDraftEventsCount || 0);

      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to update event"
          : "Failed to update event";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const deleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      setLoading(true);
      setError(null);

      // Remember status for count updates
      const eventStatus = eventToDelete.status;

      // Optimistically remove from UI
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventToDelete.id)
      );

      // Update counts based on event status
      if (eventStatus === "published") {
        setTotalEvents((prev) => Math.max(0, prev - 1));
      } else if (eventStatus === "draft") {
        setDraftEventsCount((prev) => Math.max(0, prev - 1));
      }

      // Make the API call
      await eventsApi.deleteEvent(eventToDelete.id.toString());

      setDeleteDialogOpen(false);
      setEventToDelete(null);
      toast.success(`Event "${eventToDelete.title}" deleted successfully`);
    } catch (error: unknown) {
      // Revert optimistic update on error
      setEvents(initialEvents);

      // Revert count changes
      setTotalEvents(initialTotalEvents || initialEvents.length);
      setDraftEventsCount(initialDraftEventsCount || 0);

      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to delete event"
          : "Failed to delete event";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  return (
    <>
      <ManagementBase
        title="Events Management"
        description={`Manage all events on the platform (${totalEvents} published, ${draftEventsCount} draft)`}
        addButtonLabel="Create Event"
        addButtonIcon={<Calendar className="mr-2 h-4 w-4" />}
        onAddButtonClick={handleCreateEvent}
        loading={loading}
        error={error}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.id}</TableCell>
                      <TableCell className="font-medium">
                        {event.title}
                      </TableCell>
                      <TableCell>{event.team_name}</TableCell>
                      <TableCell>{formatDate(event.start_time)}</TableCell>
                      <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                      <TableCell>{event.creator_username}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View Event"
                            onClick={() => handleViewClick(event)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit Event"
                            onClick={() => handleEditClick(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete Event"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ManagementBase>

      {/* Create Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Enter event details to create a new event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">
                Title*
              </label>
              <div className="col-span-3">
                <Input
                  id="title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  className={formErrors.title ? "border-red-500" : ""}
                  required
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="description" className="text-right pt-2">
                Description
              </label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="location" className="text-right">
                Location
              </label>
              <div className="col-span-3">
                <Input
                  id="location"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="start_time" className="text-right">
                Start Time*
              </label>
              <div className="col-span-3">
                <Input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  value={newEvent.start_time}
                  onChange={handleInputChange}
                  className={formErrors.start_time ? "border-red-500" : ""}
                  required
                />
                {formErrors.start_time && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.start_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="end_time" className="text-right">
                End Time*
              </label>
              <div className="col-span-3">
                <Input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={handleInputChange}
                  className={formErrors.end_time ? "border-red-500" : ""}
                  required
                />
                {formErrors.end_time && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.end_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="team_id" className="text-right">
                Team*
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "team_id", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  defaultValue={newEvent.team_id?.toString() || "0"}
                >
                  <SelectTrigger
                    className={formErrors.team_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.team_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.team_id}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right">
                Price
              </label>
              <div className="col-span-3">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newEvent.price}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="max_attendees" className="text-right">
                Max Attendees
              </label>
              <div className="col-span-3">
                <Input
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  min="1"
                  value={newEvent.max_attendees}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="event_type" className="text-right">
                Event Type
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "event_type", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  defaultValue={newEvent.event_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="status" className="text-right">
                Status
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleInputChange({
                      target: { name: "status", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  defaultValue={newEvent.status}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="is_public" className="text-right">
                Public Event
              </label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={newEvent.is_public}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("is_public", checked === true)
                  }
                />
                <label htmlFor="is_public" className="text-sm">
                  Make this event visible to all users
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addEvent} disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-title" className="text-right">
                Title*
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-title"
                  name="title"
                  value={editedEvent.title}
                  onChange={handleEditInputChange}
                  className={formErrors.title ? "border-red-500" : ""}
                  required
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="edit-description" className="text-right pt-2">
                Description
              </label>
              <div className="col-span-3">
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editedEvent.description}
                  onChange={handleEditInputChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-location" className="text-right">
                Location
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-location"
                  name="location"
                  value={editedEvent.location}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-start_time" className="text-right">
                Start Time*
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-start_time"
                  name="start_time"
                  type="datetime-local"
                  value={editedEvent.start_time}
                  onChange={handleEditInputChange}
                  className={formErrors.start_time ? "border-red-500" : ""}
                  required
                />
                {formErrors.start_time && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.start_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-end_time" className="text-right">
                End Time*
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-end_time"
                  name="end_time"
                  type="datetime-local"
                  value={editedEvent.end_time}
                  onChange={handleEditInputChange}
                  className={formErrors.end_time ? "border-red-500" : ""}
                  required
                />
                {formErrors.end_time && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.end_time}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-team_id" className="text-right">
                Team*
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleEditInputChange({
                      target: { name: "team_id", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  value={editedEvent.team_id?.toString()}
                >
                  <SelectTrigger
                    className={formErrors.team_id ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.team_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.team_id}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-price" className="text-right">
                Price
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedEvent.price}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-max_attendees" className="text-right">
                Max Attendees
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-max_attendees"
                  name="max_attendees"
                  type="number"
                  min="1"
                  value={editedEvent.max_attendees}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-event_type" className="text-right">
                Event Type
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleEditInputChange({
                      target: { name: "event_type", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  value={editedEvent.event_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-status" className="text-right">
                Status
              </label>
              <div className="col-span-3">
                <Select
                  onValueChange={(value) =>
                    handleEditInputChange({
                      target: { name: "status", value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  value={editedEvent.status}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-is_public" className="text-right">
                Public Event
              </label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="edit-is_public"
                  checked={editedEvent.is_public}
                  onCheckedChange={(checked) =>
                    handleEditCheckboxChange("is_public", checked === true)
                  }
                />
                <label htmlFor="edit-is_public" className="text-sm">
                  Make this event visible to all users
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEvent} disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the event
              {eventToDelete && (
                <span className="font-semibold"> "{eventToDelete.title}"</span>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
