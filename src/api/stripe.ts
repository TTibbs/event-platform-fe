import axiosClient from "@/api/axiosClient";

/**
 * Stripe API client for payments and checkout sessions
 * Aligned with backend endpoints:
 * - POST /create-checkout-session
 * - POST /sync-payment/:sessionId
 * - POST /webhook (handled by backend only)
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
};

export default stripeApi;
