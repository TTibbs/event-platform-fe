import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { stripeApi, eventsApi, ticketsApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const { user } = useAuth();

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

        // Set a flag to refresh ticket status on all event pages
        sessionStorage.setItem("refreshTicketStatus", "true");

        // Sync payment status with our backend
        await stripeApi.syncPaymentStatus(sessionId);

        // Get event details to show in success page
        if (pendingEventId && user?.id) {
          // Store the successful payment in localStorage for persistence
          const ticketCacheKey = `ticket_paid_${user.id}_${pendingEventId}`;
          localStorage.setItem(ticketCacheKey, "true");

          // Verify the payment with our tickets API to ensure it's registered
          try {
            const isPaid = await ticketsApi.hasUserPaidForEvent(
              user?.id?.toString() || "",
              pendingEventId
            );

            if (!isPaid) {
              console.warn(
                "Payment succeeded but ticket not marked as paid yet"
              );
              // Make additional check after a delay to allow backend processing
              setTimeout(async () => {
                const verifiedPaid = await ticketsApi.hasUserPaidForEvent(
                  user?.id?.toString() || "",
                  pendingEventId
                );
                console.log(
                  `Delayed payment verification: ${
                    verifiedPaid ? "successful" : "failed"
                  }`
                );
              }, 3000);
            } else {
              console.log("Payment and ticket status verified successfully");
            }
          } catch (error) {
            console.error("Error verifying ticket payment status:", error);
          }

          const eventResponse = await eventsApi.getEventById(pendingEventId);
          setEventName(eventResponse.data.event.title);
        }

        toast.success("Payment successful! Your ticket has been issued.");
      } catch (error: any) {
        console.error("Error syncing payment:", error);
        toast.error(error.message || "Failed to process payment");
      } finally {
        setIsLoading(false);
      }
    };

    syncPayment();
  }, [sessionId, navigate, user?.id]);

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
