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
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Event } from "@/types/events";
import StripeTicketCheckout from "@/components/payment/StripeTicketCheckout";
import {
  PencilIcon,
  Users,
  Calendar,
  MapPin,
  ImageIcon,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define a simplified user interface for auth context
interface AuthUser {
  id: number;
  username: string;
  role?: string;
  is_site_admin?: boolean;
}

type EventCardVariant = "default" | "dashboard" | "compact";

interface EventProps {
  event: Event;
  userId?: string | number;
  className?: string;
  variant?: EventCardVariant;
}

export function EventCard({
  event,
  userId,
  className,
  variant = "default",
}: EventProps) {
  const { user } = useAuth() as { user: AuthUser | null };
  const navigate = useNavigate();
  const [isAlreadyRegistered, setIsAlreadyRegistered] =
    useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [checkingRegistration, setCheckingRegistration] =
    useState<boolean>(true);
  const [hasPaidTicket, setHasPaidTicket] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);

  // Define a key for local storage to store ticket status
  const ticketCacheKey = userId ? `ticket_paid_${userId}_${event.id}` : null;

  const formattedStartDate = format(new Date(event.start_time), "MMM d, yyyy");
  const formattedStartTime = format(new Date(event.start_time), "h:mm a");
  const formattedEndTime = format(new Date(event.end_time), "h:mm a");

  const isPublished = event.status === "published";
  const hasTicketPrice =
    event.price !== null && event.price !== undefined && event.price > 0;
  const showTicketsRemaining =
    event.tickets_remaining !== null && event.tickets_remaining !== undefined;
  const isSoldOut = showTicketsRemaining && event.tickets_remaining === 0;

  console.log(event);

  // Check if ticket was just purchased
  useEffect(() => {
    const pendingEventId = sessionStorage.getItem("pendingEventTicket");
    const refreshFlag = sessionStorage.getItem("refreshTicketStatus");

    // If returning from payment and this is the event that was paid for
    if (refreshFlag === "true" && pendingEventId === event.id.toString()) {
      // Trigger a refresh of the payment status from the server
      if (userId) {
        const checkPaidStatus = async () => {
          try {
            // This will check with the backend if payment was completed
            const hasPaid = await ticketsApi.hasUserPaidForEvent(
              userId.toString(),
              event.id.toString()
            );

            if (hasPaid) {
              console.log(
                `User ${userId} has confirmed paid ticket for event ${event.id}`
              );

              // Update the local states
              setHasPaidTicket(true);
              setIsAlreadyRegistered(true);

              // Update the cache
              if (ticketCacheKey) {
                localStorage.setItem(ticketCacheKey, "true");
              }
            } else {
              console.log(
                `User ${userId} does not have a paid ticket for event ${event.id}`
              );
              // Make sure the UI reflects the unpaid state
              setHasPaidTicket(false);

              // Clear any stale cache
              if (ticketCacheKey) {
                localStorage.removeItem(ticketCacheKey);
              }
            }
          } catch (error) {
            console.error("Error checking paid status after redirect:", error);
          }
        };

        checkPaidStatus();
      }

      // Clear session flags
      sessionStorage.removeItem("pendingEventTicket");

      // Only clear refreshTicketStatus if this is the event that was pending
      if (pendingEventId === event.id.toString()) {
        sessionStorage.removeItem("refreshTicketStatus");
      }
    }
  }, [event.id, userId, ticketCacheKey]);

  // Check if user is registered or has ticket
  useEffect(() => {
    // Check cache for quick answer
    if (ticketCacheKey && localStorage.getItem(ticketCacheKey) === "true") {
      setHasPaidTicket(true);
      setIsAlreadyRegistered(true);
      setCheckingRegistration(false);
      return;
    }

    const checkRegistrationStatus = async () => {
      if (!userId) {
        setCheckingRegistration(false);
        return;
      }

      try {
        // Check if user has a paid ticket for this event
        if (hasTicketPrice) {
          try {
            const hasPaid = await ticketsApi.hasUserPaidForEvent(
              userId.toString(),
              event.id.toString()
            );

            if (hasPaid) {
              console.log(
                `User ${userId} has paid ticket for event ${event.id}`
              );
              setHasPaidTicket(true);
              setIsAlreadyRegistered(true);
              setRegistrationSuccess(true);

              // Cache the result
              if (ticketCacheKey) {
                localStorage.setItem(ticketCacheKey, "true");
              }
              return;
            }
          } catch (ticketError) {
            console.error("Failed to check ticket status:", ticketError);
          }
        }

        // Check registration status (if we haven't already confirmed from ticket)
        try {
          const isRegistered = await eventsApi.isUserRegistered(
            event.id.toString(),
            userId
          );

          console.log(`User registered status: ${isRegistered}`);
          setIsAlreadyRegistered(isRegistered);

          // For free events, being registered means success
          if (isRegistered && (event.price === 0 || event.price === null)) {
            setRegistrationSuccess(true);
          }
        } catch (registrationError) {
          console.error(
            "Failed to check registration status:",
            registrationError
          );
        }
      } catch (error) {
        console.error("Failed during registration/payment check:", error);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, [event.id, userId, hasTicketPrice, ticketCacheKey]);

  // Check user permissions via API call
  useEffect(() => {
    const checkEditPermissions = async () => {
      if (!userId) {
        setCheckingPermissions(false);
        return;
      }

      // Check cache first
      const permissionCacheKey = `edit_permission_${userId}_${event.id}`;
      const cachedPermission = localStorage.getItem(permissionCacheKey);
      const cacheTimestampKey = `edit_permission_timestamp_${userId}_${event.id}`;
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
      const cacheExpiry = 30 * 60 * 1000; // 30 minutes in milliseconds

      // Use cache if valid and not expired
      if (cachedPermission !== null && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();

        if (now - timestamp < cacheExpiry) {
          setCanEdit(cachedPermission === "true");
          setCheckingPermissions(false);
          return;
        }
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
          localStorage.setItem(permissionCacheKey, "true");
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          setCheckingPermissions(false);
          return;
        }

        // Get user details to check global role
        const userResponse = await usersApi.getUserById(userId.toString());
        const userData = userResponse.data.user;

        // If user is site admin, they can edit
        if (userData.is_site_admin) {
          setCanEdit(true);
          localStorage.setItem(permissionCacheKey, "true");
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          setCheckingPermissions(false);
          return;
        }

        // Only check team membership if user has teams
        if (userData.has_teams === false) {
          setCanEdit(false);
          localStorage.setItem(permissionCacheKey, "false");
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          setCheckingPermissions(false);
          return;
        }

        // Check team membership role - the API now handles 404 gracefully
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
        localStorage.setItem(permissionCacheKey, hasEditPermission.toString());
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
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
  ]);

  const handleRegister = async () => {
    if (!isPublished || !userId || isAlreadyRegistered || isSoldOut) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      await eventsApi.registerForEvent(event.id.toString(), userId);
      setRegistrationSuccess(true);
      setIsAlreadyRegistered(true);
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

  const handleEditEvent = () => {
    navigate(`/events/edit/${event.id}`);
  };

  // Function to handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Define default placeholder image styles
  const placeholderStyles = "bg-muted flex items-center justify-center h-40";

  // Apply variant-specific styles
  const cardStyles = cn(
    "w-full", // Base styles for all variants
    variant === "default" && "max-w-md mx-auto",
    variant === "dashboard" &&
      "h-full shadow-md hover:shadow-lg transition-shadow duration-200 w-96",
    variant === "compact" && "max-w-xs",
    className // Allow custom overrides via className prop
  );

  return (
    <Card className={cardStyles}>
      <div className="relative overflow-hidden rounded-t-lg">
        {!imageError && event.event_img_url ? (
          <img
            src={event.event_img_url}
            alt={event.title}
            className="w-full h-40 object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className={placeholderStyles}>
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <span className="text-sm">{event.category}</span>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-background text-foreground shadow">
          {isPublished ? "Published" : "Draft"}
        </div>
      </div>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {event.category}
            </CardDescription>
          </div>
          {!checkingPermissions && canEdit && (
            <Button variant="outline" size="sm" onClick={handleEditEvent}>
              <PencilIcon className="h-3.5 w-3.5" />
              <span className="ml-1">Edit</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="ml-0">
              {formattedStartDate}, {formattedStartTime} - {formattedEndTime}
            </div>
          </div>

          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="ml-0">
              {event.location || "Location not specified"}
            </div>
          </div>

          {event.description && (
            <div className="text-sm">
              <div
                className="line-clamp-2 text-muted-foreground"
                title={event.description}
              >
                {event.description}
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <div className="font-medium">
              {hasTicketPrice ? `£${event.price.toFixed(2)}` : "Free"}
            </div>

            <div className="flex items-center space-x-3">
              {showTicketsRemaining && (
                <div className="flex items-center">
                  <Ticket className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span className={cn(isSoldOut && "text-red-500")}>
                    {isSoldOut ? "Sold out" : `${event.tickets_remaining} left`}
                  </span>
                </div>
              )}

              {event.max_attendees !== undefined && (
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {event.max_attendees} attendees
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
            {event.team_name && (
              <div className="mb-1">Organised by {event.team_name}</div>
            )}
            {event.creator_username && (
              <div>Created by {event.creator_username}</div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          {registrationError && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{registrationError}</AlertDescription>
            </Alert>
          )}

          <div className="w-full flex space-x-2">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              Details
            </Button>

            {userId && isPublished && !event.is_past && (
              <>
                {checkingRegistration ? (
                  <Button disabled className="flex-1">
                    Checking...
                  </Button>
                ) : isSoldOut && !hasPaidTicket ? (
                  <Button
                    disabled
                    className="flex-1 bg-red-500 hover:bg-red-500"
                  >
                    Sold Out
                  </Button>
                ) : hasTicketPrice ? (
                  <StripeTicketCheckout
                    event={event}
                    buttonText={
                      hasPaidTicket
                        ? "Ticket Purchased"
                        : isAlreadyRegistered
                        ? "Complete Purchase"
                        : "Buy Ticket"
                    }
                    disabled={hasPaidTicket}
                    className={cn(
                      "flex-1",
                      hasPaidTicket &&
                        "bg-green-600 hover:bg-green-600 cursor-default"
                    )}
                  />
                ) : (
                  <Button
                    className={cn(
                      "flex-1",
                      (registrationSuccess || isAlreadyRegistered) &&
                        "bg-green-600 hover:bg-green-600"
                    )}
                    onClick={handleRegister}
                    disabled={isRegistering || isAlreadyRegistered}
                  >
                    {isRegistering
                      ? "Registering..."
                      : registrationSuccess || isAlreadyRegistered
                      ? "Registered"
                      : "Register"}
                  </Button>
                )}
              </>
            )}
            {userId && isPublished && event.is_past && (
              <Button disabled className="flex-1 bg-muted">
                Event Ended
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
