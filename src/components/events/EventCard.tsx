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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
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
import {
  useEventRegistrationStatus,
  useEventTicketStatus,
  useEventEditPermission,
  useRegisterForEvent,
} from "@/hooks/useEventQueries";
import { EventProps } from "@/types/eventCard";

export interface EventCardOptions {
  showImage?: boolean;
  showCategory?: boolean;
  showLocation?: boolean;
  showDescription?: boolean;
  showTimeDetails?: boolean;
  showPriceDetails?: boolean;
  showCreatorInfo?: boolean;
  showActionButtons?: boolean;
  fixedHeight?: boolean;
  imageHeight?: string;
  titleLines?: number;
  descriptionLines?: number;
  titleOverlay?: boolean;
}

const defaultOptions: EventCardOptions = {
  showImage: true,
  showCategory: true,
  showLocation: true,
  showDescription: true,
  showTimeDetails: true,
  showPriceDetails: true,
  showCreatorInfo: true,
  showActionButtons: true,
  fixedHeight: true,
  imageHeight: "h-56",
  titleLines: 1,
  descriptionLines: 2,
  titleOverlay: false,
};

export function EventCard({
  event,
  userId,
  className,
  variant = "default",
  options = defaultOptions,
}: EventProps & { options?: EventCardOptions }) {
  const opts = { ...defaultOptions, ...options };
  const navigate = useNavigate();
  const [registrationSuccess, setRegistrationSuccess] =
    useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // React Query hooks
  const { data: isAlreadyRegistered = false, isLoading: checkingRegistration } =
    useEventRegistrationStatus(event.id, userId);

  const { data: hasPaidTicket = false, isLoading: checkingTicket } =
    useEventTicketStatus(event.id, userId);

  const { data: canEdit = false, isLoading: checkingPermissions } =
    useEventEditPermission(event.id, userId);

  const registerMutation = useRegisterForEvent(event.id);

  // Format dates
  const formattedStartDate = format(new Date(event.start_time), "MMM d, yyyy");
  const formattedStartTime = format(new Date(event.start_time), "h:mm a");
  const formattedEndTime = format(new Date(event.end_time), "h:mm a");

  // Event properties
  const isPublished = event.status === "published";
  const hasTicketPrice =
    event.price !== null && event.price !== undefined && event.price > 0;
  const showTicketsRemaining =
    event.tickets_remaining !== null && event.tickets_remaining !== undefined;
  const isSoldOut = showTicketsRemaining && event.tickets_remaining === 0;

  // Check if ticket was just purchased
  useEffect(() => {
    const pendingEventId = sessionStorage.getItem("pendingEventTicket");
    const refreshFlag = sessionStorage.getItem("refreshTicketStatus");

    // If returning from payment and this is the event that was paid for
    if (refreshFlag === "true" && pendingEventId === event.id.toString()) {
      // Clear session flags
      sessionStorage.removeItem("pendingEventTicket");

      // Only clear refreshTicketStatus if this is the event that was pending
      if (pendingEventId === event.id.toString()) {
        sessionStorage.removeItem("refreshTicketStatus");
      }
    }
  }, [event.id]);

  // Update success state when registration status changes
  useEffect(() => {
    if (isAlreadyRegistered && (event.price === 0 || event.price === null)) {
      setRegistrationSuccess(true);
    }
  }, [isAlreadyRegistered, event.price]);

  const handleRegister = async () => {
    if (!isPublished || !userId || isAlreadyRegistered || isSoldOut) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      await registerMutation.mutateAsync(userId);
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error("Registration failed:", error);

      // Extract the error message from API response if available
      let errorMessage = "Failed to register for this event. Please try again.";

      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;

        // If user is already registered, consider it a success
        if (errorMessage.includes("already registered")) {
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
  const placeholderStyles = cn(
    "bg-muted flex items-center justify-center",
    opts.imageHeight
  );

  // Apply variant-specific styles
  const cardStyles = cn(
    "w-full overflow-hidden", // Base styles for all variants
    opts.fixedHeight && variant === "default" && "h-[32rem]",
    opts.fixedHeight && variant === "dashboard" && "h-[28rem]",
    opts.fixedHeight && variant === "compact" && "h-[26rem]",
    variant === "default" && "max-w-md mx-auto",
    variant === "dashboard" &&
      "shadow-md hover:shadow-lg transition-shadow duration-200 w-96",
    variant === "compact" && "max-w-xs",
    className // Allow custom overrides via className prop
  );

  // Title and description line clamping
  const titleClamp = cn(`font-semibold text-xl line-clamp-${opts.titleLines}`);
  const descriptionClamp = cn(
    `line-clamp-${opts.descriptionLines} text-muted-foreground`
  );

  return (
    <Card className={cardStyles}>
      {opts.showImage && (
        <div className="relative overflow-hidden">
          {!imageError && event.event_img_url ? (
            <img
              src={event.event_img_url}
              alt={event.title}
              className={cn("w-full object-cover", opts.imageHeight)}
              onError={handleImageError}
            />
          ) : (
            <div className={placeholderStyles}>
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                {opts.showCategory && (
                  <span className="text-sm">{event.category}</span>
                )}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-background text-foreground shadow">
            {isPublished ? "Published" : "Draft"}
          </div>
          {!checkingPermissions && canEdit && opts.titleOverlay && (
            <div className="absolute top-2 left-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditEvent}
                className="bg-background/80 hover:bg-background"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                <span className="ml-1">Edit</span>
              </Button>
            </div>
          )}
          {opts.titleOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <h3
                className={cn(
                  "text-white text-xl font-bold",
                  `line-clamp-${opts.titleLines}`
                )}
              >
                {event.title}
              </h3>
              {opts.showCategory && (
                <span className="text-white/80 text-sm mt-1">
                  {event.category}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {(!opts.titleOverlay || !opts.showImage) && (
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className={titleClamp}>{event.title}</CardTitle>
              {opts.showCategory && (
                <CardDescription className="text-sm text-muted-foreground">
                  {event.category}
                </CardDescription>
              )}
            </div>
            {!checkingPermissions && canEdit && (
              <Button variant="outline" size="sm" onClick={handleEditEvent}>
                <PencilIcon className="h-3.5 w-3.5" />
                <span className="ml-1">Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent
        className={cn(
          "p-4",
          (opts.titleOverlay && opts.showImage) || !opts.showImage
            ? "pt-2"
            : "pt-0"
        )}
      >
        <div className="space-y-3">
          {opts.showTimeDetails && (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="ml-0">
                {formattedStartDate}, {formattedStartTime} - {formattedEndTime}
              </div>
            </div>
          )}

          {opts.showLocation && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="ml-0">
                {event.location || "Location not specified"}
              </div>
            </div>
          )}

          {opts.showDescription && event.description && (
            <div className="text-sm">
              <div className={descriptionClamp} title={event.description}>
                {event.description}
              </div>
            </div>
          )}

          {opts.showPriceDetails && (
            <div className="flex justify-between text-sm">
              <div className="font-medium">
                {hasTicketPrice ? `£${event.price.toFixed(2)}` : "Free"}
              </div>

              <div className="flex items-center space-x-3">
                {showTicketsRemaining && (
                  <div className="flex items-center">
                    <Ticket className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span className={cn(isSoldOut && "text-red-500")}>
                      {isSoldOut
                        ? "Sold out"
                        : `${event.tickets_remaining} left`}
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
          )}

          {opts.showCreatorInfo && (
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
              {event.team_name && (
                <div className="mb-1">Organised by {event.team_name}</div>
              )}
              {event.creator_username && (
                <div>Created by {event.creator_username}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      {opts.showActionButtons && (
        <CardFooter className="p-4 pt-0 mt-auto">
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
                  {checkingRegistration || checkingTicket ? (
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
      )}
    </Card>
  );
}
