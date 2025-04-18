import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { stripeApi } from "@/api";
import { EventDetail } from "@/types/events";

interface StripeTicketCheckoutProps {
  event: EventDetail;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

export default function StripeTicketCheckout({
  event,
  buttonText = "Buy Ticket",
  className = "",
  disabled = false,
}: StripeTicketCheckoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCheckout = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to purchase tickets");
      navigate("/auth/login");
      return;
    }

    try {
      setIsLoading(true);

      // Create a checkout session with Stripe through our backend
      // Send the user ID explicitly as the backend still needs it
      const response = await stripeApi.createCheckoutSession(
        event.id.toString(),
        user.id.toString()
      );

      // Redirect to Stripe checkout page
      const { url } = response.data;

      if (url) {
        // Store the event ID in session storage to display a success message on return
        sessionStorage.setItem("pendingEventTicket", event.id.toString());

        // Redirect to Stripe-hosted checkout page
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from server");
      }
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      toast.error(error.message || "Failed to initiate checkout");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      className={className}
      disabled={disabled || isLoading}
    >
      {isLoading ? "Loading..." : buttonText}
    </Button>
  );
}
