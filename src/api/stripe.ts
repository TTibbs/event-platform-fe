import axiosClient from "@/api/axiosClient";
import ticketsApi from "@/api/tickets";

/**
 * Stripe API client for payments and checkout sessions
 * Aligned with backend endpoints:
 * - POST /stripe/create-checkout-session
 * - GET /stripe/checkout-sessions/:sessionId
 * - POST /stripe/sync-payment/:sessionId
 * - POST /stripe/webhook (handled by backend only)
 */
const stripeApi = {
  /**
   * Create a checkout session for purchasing a ticket
   * @param eventId ID of the event to purchase ticket for
   * @param userId ID of the user making the purchase
   * @returns Checkout session with URL to redirect to
   */
  createCheckoutSession: (eventId: string, userId: string) => {
    return axiosClient.post(`/stripe/create-checkout-session`, {
      eventId,
      userId,
    });
  },

  /**
   * Retrieve payment status for a checkout session
   * @param sessionId Stripe checkout session ID
   * @returns Session data including payment status
   */
  getCheckoutSession: (sessionId: string) => {
    return axiosClient.get(`/stripe/checkout-sessions/${sessionId}`);
  },

  /**
   * Verify payment status for a checkout session
   * This checks the actual status from Stripe, not just our database
   * @param sessionId Stripe checkout session ID
   * @returns Object with payment status information { status, isPaid, sessionData }
   */
  verifyPaymentStatus: async (sessionId: string) => {
    try {
      const response = await axiosClient.get(
        `/stripe/payment-status/${sessionId}`
      );
      // Extract payment status from the response
      const data = response.data;

      // Check payment status following Stripe's standards (paid, unpaid, etc.)
      const isPaid = data.status === "paid";

      return {
        status: data.status,
        isPaid,
        sessionData: data,
        hasBeenProcessed: data.hasBeenProcessed,
      };
    } catch (error) {
      console.error("Failed to verify payment status:", error);
      return {
        status: "error",
        isPaid: false,
        sessionData: null,
        hasBeenProcessed: false,
      };
    }
  },

  /**
   * Get all payment methods for a user
   * @param userId ID of the user
   * @returns List of saved payment methods
   */
  getPaymentMethods: (userId: string) => {
    return axiosClient.get(`/stripe/payment-methods/${userId}`);
  },

  /**
   * Sync payment status after a successful payment
   * @param sessionId Stripe checkout session ID
   * @returns Updated payment and ticket data
   */
  syncPaymentStatus: (sessionId: string) => {
    return axiosClient.post(`/stripe/sync-payment/${sessionId}`);
  },

  /**
   * Create a payment intent for a ticket purchase
   * This is an alternative to checkout sessions for more custom UIs
   * @param eventId ID of the event
   * @param userId ID of the user
   * @returns Payment intent with client secret
   */
  createPaymentIntent: (eventId: string, userId: string) => {
    return axiosClient.post(`/stripe/create-payment-intent`, {
      eventId,
      userId,
    });
  },

  /**
   * Checks if a payment was successful before updating the local cache
   * Use this instead of directly setting localStorage
   * @param sessionId Stripe checkout session ID
   * @param userId User ID
   * @param eventId Event ID
   * @returns Promise<boolean> True if payment is confirmed
   */
  confirmAndCachePayment: async (
    sessionId: string,
    userId: string,
    eventId: string
  ): Promise<boolean> => {
    try {
      // First verify the payment status with Stripe
      const verificationResult = await stripeApi.verifyPaymentStatus(sessionId);

      if (!verificationResult.isPaid) {
        console.warn(
          "Payment not confirmed by Stripe:",
          verificationResult.status
        );
        return false;
      }

      // If payment is verified by Stripe but not yet processed by our system, sync it
      if (!verificationResult.hasBeenProcessed) {
        console.log(
          "Payment verified by Stripe but not yet processed by backend, syncing..."
        );
        // Sync with our backend to ensure ticket is created
        await stripeApi.syncPaymentStatus(sessionId);
      }

      // Double-check with our ticket system to confirm the ticket is registered
      try {
        const ticketVerified = await ticketsApi.hasUserPaidForEvent(
          userId,
          eventId
        );

        if (ticketVerified) {
          // Only now it's safe to update the cache
          const ticketCacheKey = `ticket_paid_${userId}_${eventId}`;
          localStorage.setItem(ticketCacheKey, "true");
          return true;
        } else {
          console.warn(
            "Payment confirmed by Stripe but ticket not found in our system"
          );
          // Try syncing again
          await stripeApi.syncPaymentStatus(sessionId);
          return true; // Still return true as payment was confirmed
        }
      } catch (ticketError) {
        console.error("Error verifying ticket after payment:", ticketError);
        // Still return true if payment was confirmed by Stripe
        return true;
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      return false;
    }
  },
};

export default stripeApi;
