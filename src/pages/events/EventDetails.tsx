import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import ticketsApi from "@/api/tickets";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { EventDetail } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import StripeTicketCheckout from "@/components/payment/StripeTicketCheckout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EventDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [hasPaidTicket, setHasPaidTicket] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Store payment status in localStorage
  const getTicketCacheKey = () => {
    if (!user?.id || !id) return null;
    return `ticket_paid_${user.id}_${id}`;
  };

  // Check local storage first for a cached payment status
  useEffect(() => {
    const ticketCacheKey = getTicketCacheKey();
    if (ticketCacheKey) {
      const cachedStatus = localStorage.getItem(ticketCacheKey);
      if (cachedStatus === "true") {
        setHasPaidTicket(true);
        setIsRegistered(true);
      }
    }
  }, [user?.id, id]);

  // Force a refresh when component is focused (e.g., after payment return)
  useEffect(() => {
    const handleFocus = () => {
      setLastChecked(Date.now());
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Check if returning from payment flow
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Get stored event ID (the one that was just paid for)
      const pendingEventId = sessionStorage.getItem("pendingEventTicket");
      const refreshFlag = sessionStorage.getItem("refreshTicketStatus");

      if (refreshFlag === "true") {
        // Force refresh registration status
        setLastChecked(Date.now());
        sessionStorage.removeItem("refreshTicketStatus");
      }

      // If this is the specific event that was paid for, DON'T immediately mark as paid
      // Instead, verify with the server first
      if (pendingEventId === id && user?.id) {
        try {
          // Verify actual payment status with the server before marking as paid
          const isPaid = await ticketsApi.hasUserPaidForEvent(
            user.id.toString(),
            id.toString()
          );

          if (isPaid) {
            setIsRegistered(true);
            setHasPaidTicket(true);

            // Cache the paid status in localStorage
            const ticketCacheKey = getTicketCacheKey();
            if (ticketCacheKey) {
              localStorage.setItem(ticketCacheKey, "true");
            }
          } else {
            // Ensure we don't show as paid if the server says it's not paid
            setHasPaidTicket(false);

            // Clear any stale cache
            const ticketCacheKey = getTicketCacheKey();
            if (ticketCacheKey) {
              localStorage.removeItem(ticketCacheKey);
            }
          }

          // Clear the pendingEventTicket regardless of payment status
          sessionStorage.removeItem("pendingEventTicket");
        } catch (error) {
          console.error("Failed to verify payment status:", error);
          // On error, don't change payment status, but clear pending flag
          sessionStorage.removeItem("pendingEventTicket");
        }
      }
    };

    checkPaymentStatus();
  }, [id, user?.id]);

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

        // Check if user can edit this event
        if (isAuthenticated && user && eventData.team_id) {
          checkEditPermission(eventData);
        }

        // Check if user is registered for this event
        if (isAuthenticated && user?.id) {
          checkRegistrationStatus(eventData.id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load event");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, isAuthenticated, user, lastChecked]);

  // Check if user has permission to edit this event
  const checkEditPermission = async (eventData: EventDetail) => {
    if (!user?.id) return;

    try {
      // If user is site admin, they can edit
      if (user.is_site_admin) {
        setCanEdit(true);
        return;
      }

      // Check if user is the creator
      const currentUserId = Number(user.id);
      const eventCreatorId = Number(eventData.created_by);

      if (
        currentUserId === eventCreatorId ||
        user.username === eventData.creator_username
      ) {
        setCanEdit(true);
        return;
      }

      // Check team role for permission
      try {
        const roleResponse = await teamsApi.getMemberRoleByUserId(
          user.id.toString()
        );
        const userRole = roleResponse.data.role;

        // Check if user has appropriate role
        if (
          ["team_admin", "event_manager", "owner", "organizer"].includes(
            userRole
          )
        ) {
          setCanEdit(true);
          return;
        }
      } catch (err) {
        console.error("Failed to check team role:", err);
        setCanEdit(false);
      }

      // If all checks fail, user cannot edit
      setCanEdit(false);
    } catch (err) {
      console.error("Failed to check edit permissions:", err);
      setCanEdit(false);
    }
  };

  // Check if user is registered for this event and has a paid ticket
  const checkRegistrationStatus = async (eventId: number) => {
    if (!user?.id) return;

    try {
      // Check if registered
      const isUserRegistered = await eventsApi.isUserRegistered(
        eventId.toString(),
        user.id.toString()
      );
      setIsRegistered(isUserRegistered);
      // If registered, check if they have a paid ticket
      if (isUserRegistered && event?.price && event.price > 0) {
        try {
          // Use multiple retries for ticket status check (in case of backend delay)
          let attempts = 0;
          let hasPaid = false;

          while (attempts < 3 && !hasPaid) {
            hasPaid = await ticketsApi.hasUserPaidForEvent(
              user.id.toString(),
              eventId.toString()
            );

            if (hasPaid) {
              break;
            }

            // Wait between retries
            if (!hasPaid && attempts < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            attempts++;
          }

          // Update state based on final status
          setHasPaidTicket(hasPaid);

          // Cache the result in localStorage
          const ticketCacheKey = getTicketCacheKey();
          if (hasPaid && ticketCacheKey) {
            localStorage.setItem(ticketCacheKey, "true");
          }
        } catch (error) {
          console.error("Failed to check ticket status:", error);
        }
      }
    } catch (error) {
      console.error("Failed to check registration status:", error);
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

  // Navigate to edit page
  const handleEditEvent = () => {
    if (id) {
      navigate(`/events/${id}/edit`);
    }
  };

  const openDeleteDialog = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);

      await eventsApi.deleteEvent(id);
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>
    );
  if (!event)
    return <div className="container mx-auto px-4 py-8">Event not found</div>;

  return (
    <>
      <section className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleEditEvent}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                <PencilIcon className="h-4 w-4" />
                Edit Event
              </Button>
              <Button
                onClick={openDeleteDialog}
                className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                <TrashIcon className="h-4 w-4" />
                Delete Event
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card text-card-foreground shadow-md rounded-lg p-6 mb-6">
          <div className="mb-4">
            <img
              src={event.event_img_url}
              alt={event.title}
              className="w-1/2 h-auto object-cover rounded-lg mb-4"
            />
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
              {event.max_attendees !== undefined && (
                <div>
                  <p className="text-muted-foreground">Capacity:</p>
                  <p className="font-medium">{event.max_attendees} attendees</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchase ticket section */}
        {event.price !== undefined &&
          event.price !== null &&
          event.price > 0 &&
          isAuthenticated && (
            <div className="bg-card text-card-foreground shadow-md rounded-lg p-6 mb-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Ticket Purchase</h2>
                <p className="mb-4">
                  {event.is_past
                    ? "This event has already ended."
                    : isRegistered
                    ? hasPaidTicket
                      ? "You have already purchased a ticket for this event."
                      : "You are registered for this event. Complete your purchase to receive your ticket."
                    : "Purchase your ticket to attend this event."}
                </p>
                <p className="text-muted-foreground mb-4">
                  {event.tickets_remaining} tickets remaining
                </p>

                <div className="flex items-center gap-4">
                  <p className="font-medium text-lg">
                    £{(event.price ?? 0).toFixed(2)}
                  </p>
                  {event.is_past ? (
                    <Button disabled className="bg-muted">
                      Event Ended
                    </Button>
                  ) : (
                    <StripeTicketCheckout
                      event={event}
                      buttonText={
                        hasPaidTicket
                          ? "Ticket Purchased"
                          : isRegistered
                          ? "Complete Purchase"
                          : "Buy Ticket"
                      }
                      disabled={event.status !== "published" || hasPaidTicket}
                      className={`${
                        hasPaidTicket
                          ? "bg-green-600 hover:bg-green-600 text-white"
                          : ""
                      } disabled:cursor-not-allowed`}
                    />
                  )}
                </div>

                {event.status !== "published" && !event.is_past && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Ticket sales are not available while the event is in{" "}
                    {event.status} status.
                  </p>
                )}
              </div>
            </div>
          )}

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

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
