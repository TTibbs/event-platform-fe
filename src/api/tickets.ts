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
};

export default ticketsApi;
