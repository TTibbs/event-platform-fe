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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EventProps {
  event: {
    id: number;
    title: string;
    description: string;
    location: string;
    start_time: string;
    end_time: string;
    price: number;
    max_attendees: number;
    status: string;
    event_type: string;
    creator_username: string;
    team_name: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    created_by: number;
    team_id: number;
  };
  userId?: string | number;
}

export function EventCard({ event, userId }: EventProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  const formattedStartDate = format(new Date(event.start_time), "MMM d, yyyy");
  const formattedStartTime = format(new Date(event.start_time), "h:mm a");
  const formattedEndTime = format(new Date(event.end_time), "h:mm a");

  const isPublished = event.status === "published";

  useEffect(() => {
    // Check if the user is already registered for this event
    const checkRegistrationStatus = async () => {
      if (!userId) {
        setCheckingRegistration(false);
        return;
      }

      try {
        const isRegistered = await eventsApi.isUserRegistered(
          event.id.toString(),
          userId
        );
        setIsAlreadyRegistered(isRegistered);
      } catch (error) {
        console.error("Failed to check registration status:", error);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, [event.id, userId]);

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
          <div className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">
            {isPublished ? "Published" : "Draft"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{event.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Date & Time</p>
            <p>{formattedStartDate}</p>
            <p>
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>
          <div>
            <p className="font-medium">Location</p>
            <p>{event.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Price</p>
            <p>${event.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-medium">Max Attendees</p>
            <p>{event.max_attendees}</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Organized by {event.team_name}</p>
          <p>Created by {event.creator_username}</p>
        </div>

        {isAlreadyRegistered && (
          <Alert>
            <AlertDescription>
              You are already registered for this event!
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
      <CardFooter>
        {checkingRegistration ? (
          <Button disabled className="w-full">
            Checking registration status...
          </Button>
        ) : isAlreadyRegistered ? (
          <Button disabled className="w-full bg-green-600 hover:bg-green-600">
            Already Registered
          </Button>
        ) : (
          <Button
            disabled={
              !isPublished || isRegistering || registrationSuccess || !userId
            }
            className="w-full"
            onClick={handleRegister}
          >
            {isRegistering ? "Registering..." : "Register Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
