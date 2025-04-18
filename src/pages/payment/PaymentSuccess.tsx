import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { stripeApi, eventsApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);

  // Get session_id from URL params (returned by Stripe)
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const syncPayment = async () => {
      try {
        setIsLoading(true);

        // Get the event ID from session storage (set during checkout)
        const pendingEventId = sessionStorage.getItem("pendingEventTicket");
        setEventId(pendingEventId);

        if (!sessionId) {
          throw new Error("No session ID provided");
        }

        // Sync payment status with our backend
        // The backend will use the authenticated user from the session
        await stripeApi.syncPaymentStatus(sessionId);

        // Get event details to show in success page
        if (pendingEventId) {
          const eventResponse = await eventsApi.getEventById(pendingEventId);
          setEventName(eventResponse.data.event.title);
        }

        // Clear the pending event ID from session storage
        sessionStorage.removeItem("pendingEventTicket");

        toast.success("Payment successful! Your ticket has been issued.");
      } catch (error: any) {
        console.error("Error syncing payment:", error);
        toast.error(error.message || "Failed to process payment");
      } finally {
        setIsLoading(false);
      }
    };

    syncPayment();
  }, [sessionId, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-card text-card-foreground shadow-md rounded-lg p-8 flex flex-col items-center">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          Payment Successful!
        </h1>

        {isLoading ? (
          <p className="text-center text-muted-foreground mb-6">
            Processing your payment...
          </p>
        ) : (
          <p className="text-center text-muted-foreground mb-6">
            Your ticket for {eventName || "the event"} has been issued and sent
            to your email.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 w-full">
          <Button
            onClick={() => navigate(eventId ? `/events/${eventId}` : "/events")}
          >
            View Event Details
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/profile")}
            className="flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            View My Tickets
          </Button>
        </div>
      </div>
    </div>
  );
}
