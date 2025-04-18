import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import ticketsApi from "@/api/tickets";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Event, EventDetail, UpdateEventParams } from "@/types/events";
import StripeTicketCheckout from "@/components/payment/StripeTicketCheckout";

// Define a simplified user interface for auth context
interface AuthUser {
  id: number;
  username: string;
  role?: string;
  is_site_admin?: boolean;
}

interface EventProps {
  event: Event;
  userId?: string | number;
}

export function EventCard({ event, userId }: EventProps) {
  const { user } = useAuth() as { user: AuthUser | null };
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [isAlreadyRegistered, setIsAlreadyRegistered] =
    useState<boolean>(false);
  const [checkingRegistration, setCheckingRegistration] =
    useState<boolean>(true);
  const [hasPaidTicket, setHasPaidTicket] = useState<boolean>(false);

  // Add last checked timestamp to force refresh after navigation
  const [lastChecked, setLastChecked] = useState<number>(Date.now());

  // Store paid ticket status in localStorage to prevent repurchase
  const ticketCacheKey = `ticket_paid_${userId}_${event.id}`;

  // Check local storage first for paid status (used to prevent flickering UI)
  useEffect(() => {
    if (userId) {
      const cachedStatus = localStorage.getItem(ticketCacheKey);
      if (cachedStatus === "true") {
        console.log("Found cached paid status, marking as paid");
        setHasPaidTicket(true);
        setIsAlreadyRegistered(true);
      }
    }
  }, [userId, event.id, ticketCacheKey]);

  // Check if returning from payment flow
  useEffect(() => {
    const checkPaymentStatus = () => {
      // Get stored event ID (the one that was just paid for)
      const pendingEventId = sessionStorage.getItem("pendingEventTicket");
      const refreshFlag = sessionStorage.getItem("refreshTicketStatus");

      if (refreshFlag === "true") {
        // Force refresh of ALL events (global payment completed)
        console.log("Payment completed, refreshing all events");
        setLastChecked(Date.now());
        sessionStorage.removeItem("refreshTicketStatus");
      }

      // If this is the specific event that was paid for
      if (pendingEventId === event.id.toString() && userId) {
        console.log(
          `This event (${event.id}) was just paid for by user ${userId}`
        );

        // Immediately mark as paid to prevent flicker
        setIsAlreadyRegistered(true);
        setHasPaidTicket(true);

        // Cache the paid status in localStorage
        localStorage.setItem(ticketCacheKey, "true");
      }
    };

    checkPaymentStatus();
  }, [event.id, userId, ticketCacheKey]);

  // Force refresh when component is focused
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, checking for registration updates");
      setLastChecked(Date.now());
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Check registration and payment status on mount and when lastChecked changes
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!userId) {
        setCheckingRegistration(false);
        return;
      }

      setCheckingRegistration(true);
      console.log(
        `Checking registration for event ${
          event.id
        }, user ${userId} at ${new Date().toISOString()}`
      );

      try {
        // First check if registered
        const isRegistered = await eventsApi.isUserRegistered(
          event.id.toString(),
          userId
        );
        setIsAlreadyRegistered(isRegistered);
        console.log(`User registered status: ${isRegistered}`);

        // If registered and it's a paid event, check ticket status
        if (isRegistered && event.price > 0) {
          try {
            // Use multiple retries for ticket status check (in case of backend delay)
            let attempts = 0;
            let hasPaid = false;

            while (attempts < 3 && !hasPaid) {
              console.log(`Checking payment status, attempt ${attempts + 1}`);

              hasPaid = await ticketsApi.hasUserPaidForEvent(userId, event.id);

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
            if (hasPaid) {
              localStorage.setItem(ticketCacheKey, "true");
              setRegistrationSuccess(true);
            }
          } catch (ticketError) {
            console.error("Failed to check ticket status:", ticketError);
          }
        } else if (
          isRegistered &&
          (event.price === 0 || event.price === null)
        ) {
          // For free events, being registered means success
          setRegistrationSuccess(true);
        }
      } catch (error) {
        console.error("Failed to check registration status:", error);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, [event.id, userId, event.price, lastChecked, ticketCacheKey]);

  // Edit event state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editedEvent, setEditedEvent] = useState<Partial<EventDetail>>({
    title: event.title,
    description: event.description,
    location: event.location,
    start_time: new Date(event.start_time).toISOString().slice(0, 16),
    end_time: new Date(event.end_time).toISOString().slice(0, 16),
    price: event.price,
    max_attendees: event.max_attendees,
    status: event.status as "draft" | "published" | "cancelled",
    event_type: event.event_type,
    is_public: event.is_public,
  });

  // Permission states
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);

  const formattedStartDate = format(new Date(event.start_time), "MMM d, yyyy");
  const formattedStartTime = format(new Date(event.start_time), "h:mm a");
  const formattedEndTime = format(new Date(event.end_time), "h:mm a");

  const isPublished = event.status === "published";

  // Check user permissions via API call
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!userId) {
        setCheckingPermissions(false);
        return;
      }

      try {
        // Check if user is the creator - add detailed logging
        const currentUserId = Number(userId);
        const eventCreatorId = Number(event.created_by);

        if (
          currentUserId === eventCreatorId ||
          user?.username === event.creator_username
        ) {
          setCanEdit(true);
          setCheckingPermissions(false);
          return;
        }

        // Get user details to check global role
        const userResponse = await usersApi.getUserById(userId.toString());
        const userData = userResponse.data.user;

        // If user is site admin, they can edit
        if (userData.is_site_admin) {
          setCanEdit(true);
          setCheckingPermissions(false);
          return;
        }

        // Check team membership role
        try {
          // This gets all team memberships for a user
          const membershipResponse = await teamsApi.getMemberByUserId(
            userId.toString()
          );
          const memberships = membershipResponse.data.team_members || [];

          // Check if the user has edit permission in the event's team
          const hasEditPermission = memberships.some(
            (membership: any) =>
              membership.team_id === event.team_id &&
              ["team_admin", "owner", "organizer", "event_manager"].includes(
                membership.role
              )
          );

          setCanEdit(hasEditPermission);
        } catch (error) {
          console.error("Failed to check team membership:", error);
          setCanEdit(false);
        }
      } catch (error) {
        console.error("Failed to check user permissions:", error);
        setCanEdit(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkEditPermissions();
  }, [
    event.created_by,
    event.team_id,
    userId,
    event.creator_username,
    user?.username,
    event.title,
  ]);

  const handleRegister = async () => {
    if (!isPublished || !userId || isAlreadyRegistered) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      await eventsApi.registerForEvent(event.id.toString(), userId);
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error("Registration failed:", error);

      // Extract the error message from API response if available
      let errorMessage = "Failed to register for this event. Please try again.";

      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;

        // If user is already registered, consider it a success
        if (errorMessage.includes("already registered")) {
          setIsAlreadyRegistered(true);
          return;
        }
      }

      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEditEvent = async () => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updateParams: UpdateEventParams = editedEvent as UpdateEventParams;
      await eventsApi.updateEvent(event.id.toString(), updateParams);
      setUpdateSuccess(true);
      // Close the modal after 1 second to show success
      setTimeout(() => {
        setShowEditModal(false);
        // Reload the page or update the event in place
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Update failed:", error);
      let errorMessage = "Failed to update this event. Please try again.";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      }
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedEvent({
      ...editedEvent,
      [name]:
        name === "price" || name === "max_attendees" ? Number(value) : value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedEvent({
      ...editedEvent,
      [name]:
        name === "status"
          ? (value as "draft" | "published" | "cancelled")
          : value,
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {event.event_type.charAt(0).toUpperCase() +
                event.event_type.slice(1)}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <div className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
              {isPublished ? "Published" : "Draft"}
            </div>
            {!checkingPermissions && canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{event.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground">Date & Time</p>
            <p className="text-muted-foreground">{formattedStartDate}</p>
            <p className="text-muted-foreground">
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Location</p>
            <p className="text-muted-foreground">{event.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground">Price</p>
            <p className="text-muted-foreground">
              {event.price !== null && event.price !== undefined
                ? `$${event.price.toFixed(2)}`
                : "Free"}
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Max Attendees</p>
            <p className="text-muted-foreground">{event.max_attendees}</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Organised by {event.team_name}</p>
          <p>Created by {event.creator_username}</p>
        </div>

        {isAlreadyRegistered && hasPaidTicket && (
          <Alert>
            <AlertDescription>
              You have purchased a ticket for this event!
            </AlertDescription>
          </Alert>
        )}

        {isAlreadyRegistered && !hasPaidTicket && event.price > 0 && (
          <Alert>
            <AlertDescription>
              You are registered but need to complete payment.
            </AlertDescription>
          </Alert>
        )}

        {isAlreadyRegistered && (event.price === 0 || event.price === null) && (
          <Alert>
            <AlertDescription>
              You are registered for this event!
            </AlertDescription>
          </Alert>
        )}

        {registrationSuccess && !isAlreadyRegistered && (
          <Alert>
            <AlertDescription>
              Successfully registered for this event!
            </AlertDescription>
          </Alert>
        )}

        {registrationError && (
          <Alert variant="destructive">
            <AlertDescription>{registrationError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {checkingRegistration ? (
          <Button disabled className="w-full disabled:cursor-not-allowed">
            Checking registration status...
          </Button>
        ) : isAlreadyRegistered && hasPaidTicket ? (
          <Button
            disabled
            className="w-full bg-green-600 hover:bg-green-600 text-white disabled:cursor-not-allowed"
          >
            Ticket Purchased
          </Button>
        ) : isAlreadyRegistered && !hasPaidTicket && event.price > 0 ? (
          <StripeTicketCheckout
            event={event}
            buttonText="Complete Purchase"
            disabled={!isPublished || !userId || hasPaidTicket}
            className="w-full disabled:cursor-not-allowed"
          />
        ) : event.price && event.price > 0 ? (
          // Stripe checkout for paid events
          <StripeTicketCheckout
            event={event}
            buttonText="Purchase Ticket"
            disabled={!isPublished || !userId || hasPaidTicket}
            className="w-full disabled:cursor-not-allowed"
          />
        ) : (
          // Regular registration for free events
          <Button
            disabled={
              !isPublished || isRegistering || registrationSuccess || !userId
            }
            className="w-full disabled:cursor-not-allowed"
            onClick={handleRegister}
          >
            {isRegistering ? "Registering..." : "Register Now"}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => navigate(`/events/${event.id}`)}
        >
          View Event
        </Button>
      </CardFooter>

      {/* Edit Event Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                value={editedEvent.title}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={editedEvent.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={editedEvent.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={editedEvent.start_time}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                End Time
              </Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={editedEvent.end_time}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editedEvent.price ?? ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max_attendees" className="text-right">
                Max Attendees
              </Label>
              <Input
                id="max_attendees"
                name="max_attendees"
                type="number"
                min="1"
                value={editedEvent.max_attendees}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                onValueChange={(value) => handleSelectChange("status", value)}
                defaultValue={editedEvent.status}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event_type" className="text-right">
                Event Type
              </Label>
              <Input
                id="event_type"
                name="event_type"
                value={editedEvent.event_type}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_public" className="text-right">
                Public Event
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={editedEvent.status === "published"}
                  onCheckedChange={(checked) =>
                    handleSelectChange(
                      "status",
                      checked ? "published" : "draft"
                    )
                  }
                />
                <label
                  htmlFor="is_public"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Make this event public
                </label>
              </div>
            </div>
          </div>

          {updateSuccess && (
            <Alert className="mt-2">
              <AlertDescription>Successfully updated event!</AlertDescription>
            </Alert>
          )}

          {updateError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
