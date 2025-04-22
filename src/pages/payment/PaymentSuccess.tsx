import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { stripeApi, eventsApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Check, Calendar, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);
  const { user } = useAuth();

  // Get session_id from URL params (returned by Stripe)
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyAndSyncPayment = async () => {
      try {
        setIsLoading(true);

        // Get the event ID from session storage (set during checkout)
        const pendingEventId = sessionStorage.getItem("pendingEventTicket");
        setEventId(pendingEventId);

        if (!sessionId) {
          throw new Error("No session ID provided");
        }

        if (!pendingEventId) {
          throw new Error("No event ID found in session storage");
        }

        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        // First directly check payment status from the API
        const verificationResult = await stripeApi.verifyPaymentStatus(
          sessionId
        );

        // Log payment status for debugging
        console.log("Payment status verification:", verificationResult);

        if (!verificationResult.isPaid) {
          // Payment was not completed (user likely abandoned checkout)
          console.warn("User abandoned payment at Stripe checkout");
          setPaymentVerified(false);
          toast.error(
            "Your payment was not completed. Please try again when you're ready to purchase."
          );

          // Remove the refreshTicketStatus flag to prevent false positives on event cards
          sessionStorage.removeItem("refreshTicketStatus");
          setIsLoading(false);
          return;
        }

        // If we're here, the payment was completed, set the flag to refresh ticket status on all event pages
        sessionStorage.setItem("refreshTicketStatus", "true");

        // Verify and sync payment status with our new method (this will also update localStorage)
        const paymentConfirmed = await stripeApi.confirmAndCachePayment(
          sessionId,
          user?.id?.toString() || "",
          pendingEventId
        );

        setPaymentVerified(paymentConfirmed);

        if (paymentConfirmed) {
          // Get event details to show in success page
          const eventResponse = await eventsApi.getEventById(pendingEventId);
          setEventName(eventResponse.data.event.title);

          toast.success("Payment successful! Your ticket has been issued.");
        } else {
          // There was an issue with the backend processing
          console.error(
            "Payment verified with Stripe but couldn't be processed by our system"
          );
          toast.error(
            "We verified your payment but had trouble issuing your ticket. Please contact support if you don't see your ticket soon."
          );
        }
      } catch (error: any) {
        console.error("Error processing payment:", error);
        setPaymentVerified(false);
        toast.error(error.message || "Failed to process payment");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndSyncPayment();
  }, [sessionId, navigate, user?.id]);

  const handleTryAgain = () => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-card text-card-foreground shadow-md rounded-lg p-8 flex flex-col items-center">
        {isLoading ? (
          <>
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-primary/50"></div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">
              Verifying Payment...
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              Please wait while we confirm your payment with Stripe.
            </p>
          </>
        ) : paymentVerified ? (
          <>
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">
              Payment Successful!
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              Your ticket for {eventName || "the event"} has been issued and
              sent to your email.
            </p>
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button
                onClick={() =>
                  navigate(eventId ? `/events/${eventId}` : "/events")
                }
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
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">
              Payment Verification Failed
            </h1>
            <p className="text-center text-muted-foreground mb-6">
              We couldn't verify your payment. If you believe you were charged,
              please contact our support team for assistance.
            </p>
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button onClick={handleTryAgain}>Try Again</Button>
              <Button
                variant="outline"
                onClick={() => navigate("/support")}
                className="flex items-center justify-center gap-2"
              >
                Contact Support
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
