import axiosClient from "@/api/axiosClient";
import { CreateTicketParams, UpdateTicketParams } from "@/types/tickets";

const ticketsApi = {
  getAllTickets: () => {
    return axiosClient.get("/tickets");
  },

  getTicketById: (id: string) => {
    return axiosClient.get(`/tickets/${id}`);
  },

  getUserTickets: (userId: string) => {
    return axiosClient.get(`/tickets/user/${userId}`);
  },

  getEventTickets: (eventId: string) => {
    return axiosClient.get(`/tickets/event/${eventId}`);
  },

  verifyTicket: (ticketCode: string) => {
    return axiosClient.get(`/tickets/verify/${ticketCode}`);
  },

  createTicket: (params: CreateTicketParams) => {
    return axiosClient.post("/tickets", params);
  },

  useTicket: (ticketCode: string) => {
    return axiosClient.post(`/tickets/use/${ticketCode}`);
  },

  updateTicket: (id: string, params: UpdateTicketParams) => {
    return axiosClient.patch(`/tickets/${id}`, params);
  },

  deleteTicket: (id: string) => {
    return axiosClient.delete(`/tickets/${id}`);
  },

  /**
   * Check if a user has a paid ticket for an event
   * @param userId The user ID to check
   * @param eventId The event ID to check
   * @returns Promise resolving to true if the user has a paid ticket, false otherwise
   */
  hasUserPaidForEvent: async (
    userId: string | number,
    eventId: string | number
  ): Promise<boolean> => {
    try {
      const response = await axiosClient.get(
        `/tickets/user/${userId}/event/${eventId}`
      );

      // Check for the new API response format {hasUserPaid: boolean}
      if (response.data.hasUserPaid !== undefined) {
        return response.data.hasUserPaid;
      }

      // Fallback to the original implementation if the new format isn't present
      const tickets = response.data.tickets || [];
      return tickets.some((ticket: any) => ticket.paid === true);
    } catch (error) {
      console.error("Error checking ticket status:", error);
      return false;
    }
  },
};

export default ticketsApi;
