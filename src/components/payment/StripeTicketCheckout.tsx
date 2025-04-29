import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { stripeApi, ticketsApi } from "@/api";
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
  const [verifiedPaid, setVerifiedPaid] = useState<boolean>(false);
  const [verificationChecked, setVerificationChecked] =
    useState<boolean>(false);

  // Check for pending checkout sessions when component mounts
  useEffect(() => {
    const checkPendingCheckout = async () => {
      // If there's a pending ticket in session storage for this event, check its status
      const pendingEventId = sessionStorage.getItem("pendingEventTicket");

      if (pendingEventId === event.id.toString() && user?.id) {
        // We might have an abandoned checkout, verify with backend
        try {
          const isPaid = await ticketsApi.hasUserPaidForEvent(
            user.id.toString(),
            event.id.toString()
          );

          // If not paid, clear the pendingEventTicket to prevent confusion
          if (!isPaid) {
            sessionStorage.removeItem("pendingEventTicket");
            localStorage.removeItem(`ticket_paid_${user.id}_${event.id}`);
          }
        } catch (error) {
          console.error("Error checking pending checkout:", error);
        }
      }
    };

    checkPendingCheckout();
  }, [event.id, user?.id]);

  // Double check ticket status on component mount
  useEffect(() => {
    const verifyTicketStatus = async () => {
      if (!user?.id || !event?.id) return;

      try {
        setIsLoading(true);

        // Check cache first
        const ticketCacheKey = `ticket_paid_${user.id}_${event.id}`;
        const cachedStatus = localStorage.getItem(ticketCacheKey);

        // If cached as paid, verify with server
        if (cachedStatus === "true") {
          // Verify with backend to ensure cache isn't stale
          const isPaid = await ticketsApi.hasUserPaidForEvent(
            user.id.toString(),
            event.id.toString()
          );

          // Update state and cache based on server response
          if (isPaid) {
            setVerifiedPaid(true);
          } else {
            // Cache is stale, remove it
            localStorage.removeItem(ticketCacheKey);
          }
        } else {
          // No cached status, check with the server
          const isPaid = await ticketsApi.hasUserPaidForEvent(
            user.id.toString(),
            event.id.toString()
          );

          if (isPaid) {
            // Update local cache
            localStorage.setItem(ticketCacheKey, "true");
            setVerifiedPaid(true);
          }
        }

        setVerificationChecked(true);
      } catch (error) {
        console.error("Error verifying ticket status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyTicketStatus();
  }, [user?.id, event?.id]);

  const handleCheckout = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to purchase tickets");
      navigate("/auth/login");
      return;
    }

    // Double-check if already paid
    if (verifiedPaid) {
      toast.info("You've already purchased a ticket for this event");
      return;
    }

    try {
      setIsLoading(true);

      // Create a checkout session with Stripe through our backend
      const response = await stripeApi.createCheckoutSession(
        event.id.toString(),
        user.id.toString()
      );

      // Redirect to Stripe checkout page
      const { url } = response.data;

      if (url) {
        // Store the event ID in session storage without setting the refreshTicketStatus flag
        // (payment verification will happen in PaymentSuccess component)
        sessionStorage.setItem("pendingEventTicket", event.id.toString());

        // Clear any previous payment flags for this event to prevent false positives
        const ticketCacheKey = `ticket_paid_${user.id}_${event.id}`;
        localStorage.removeItem(ticketCacheKey);

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
      className={`${className} ${
        !disabled && !isLoading && !verifiedPaid ? "cursor-pointer" : ""
      }`}
      disabled={disabled || isLoading || verifiedPaid}
    >
      {isLoading
        ? "Loading..."
        : verifiedPaid
        ? "Ticket Purchased"
        : buttonText}
    </Button>
  );
}
