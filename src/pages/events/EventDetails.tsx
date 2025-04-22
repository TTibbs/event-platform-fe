import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import ticketsApi from "@/api/tickets";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { EventDetail } from "@/types/events";
import { Button } from "@/components/ui/button";
import { Calendar, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import StripeTicketCheckout from "@/components/payment/StripeTicketCheckout";

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
        console.log("Found cached paid ticket status, marking as paid");
        setHasPaidTicket(true);
        setIsRegistered(true);
      }
    }
  }, [user?.id, id]);

  // Force a refresh when component is focused (e.g., after payment return)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, checking for registration updates");
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
        console.log("Payment completed, refreshing status");
        setLastChecked(Date.now());
        sessionStorage.removeItem("refreshTicketStatus");
      }

      // If this is the specific event that was paid for, DON'T immediately mark as paid
      // Instead, verify with the server first
      if (pendingEventId === id && user?.id) {
        console.log(
          `This event (${id}) was pending payment by user ${user.id}`
        );

        try {
          // Verify actual payment status with the server before marking as paid
          const isPaid = await ticketsApi.hasUserPaidForEvent(
            user.id.toString(),
            id.toString()
          );

          if (isPaid) {
            console.log("Payment verified by server, marking as paid");
            setIsRegistered(true);
            setHasPaidTicket(true);

            // Cache the paid status in localStorage
            const ticketCacheKey = getTicketCacheKey();
            if (ticketCacheKey) {
              localStorage.setItem(ticketCacheKey, "true");
            }
          } else {
            console.log(
              "Server confirmed payment not completed, clearing pending status"
            );
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
          checkEditPermission(eventData.team_id);
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

  // Check if user is registered for this event and has a paid ticket
  const checkRegistrationStatus = async (eventId: number) => {
    if (!user?.id) return;

    try {
      console.log(
        `Checking registration for event ${eventId}, user ${user.id}`
      );

      // Check if registered
      const isUserRegistered = await eventsApi.isUserRegistered(
        eventId.toString(),
        user.id.toString()
      );
      setIsRegistered(isUserRegistered);
      console.log(`User registered status: ${isUserRegistered}`);

      // If registered, check if they have a paid ticket
      if (isUserRegistered && event?.price && event.price > 0) {
        try {
          // Use multiple retries for ticket status check (in case of backend delay)
          let attempts = 0;
          let hasPaid = false;

          while (attempts < 3 && !hasPaid) {
            console.log(`Checking payment status, attempt ${attempts + 1}`);

            hasPaid = await ticketsApi.hasUserPaidForEvent(
              user.id.toString(),
              eventId.toString()
            );

            if (hasPaid) {
              console.log("Found paid ticket!");
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
      navigate(`/events/edit/${id}`);
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
          <Button
            onClick={handleEditEvent}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Event
          </Button>
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

      {/* Purchase ticket section */}
      {event.price !== undefined &&
        event.price !== null &&
        event.price > 0 &&
        isAuthenticated && (
          <div className="bg-card text-card-foreground shadow-md rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Ticket Purchase</h2>
              <p className="mb-4">
                {isRegistered
                  ? hasPaidTicket
                    ? "You have already purchased a ticket for this event."
                    : "You are registered for this event. Complete your purchase to receive your ticket."
                  : "Purchase your ticket to attend this event."}
              </p>

              <div className="flex items-center gap-4">
                <p className="font-medium text-lg">
                  ${(event.price ?? 0).toFixed(2)}
                </p>
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
              </div>

              {event.status !== "published" && (
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
  );
}
