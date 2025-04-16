import axiosClient from "@/api/axiosClient";

interface CreateEventParams {
  title: string;
  start_time: string;
  end_time: string;
  team_id: string;
  [key: string]: any;
}

interface UpdateEventParams {
  [key: string]: any;
}

interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  registration_time: string;
  status: string;
  username: string;
  email: string;
}

const eventsApi = {
  getAllEvents: () => {
    return axiosClient.get("/events");
  },

  getUpcomingEvents: () => {
    return axiosClient.get("/events/upcoming");
  },

  getEventsByTeam: (teamId: string) => {
    return axiosClient.get(`/events/team/${teamId}`);
  },

  getEventById: (id: string) => {
    return axiosClient.get(`/events/${id}`);
  },

  getEventRegistrations: (id: string) => {
    return axiosClient.get(`/events/${id}/registrations`);
  },

  checkEventAvailability: (eventId: string) => {
    return axiosClient.get(`/events/${eventId}/availability`);
  },

  createEvent: (params: CreateEventParams) => {
    return axiosClient.post("/events", params);
  },

  updateEvent: (id: string, params: UpdateEventParams) => {
    return axiosClient.patch(`/events/${id}`, params);
  },

  deleteEvent: (id: string) => {
    return axiosClient.delete(`/events/${id}`);
  },

  registerForEvent: (eventId: string, userId: string | number) => {
    return axiosClient.post(`/events/${eventId}/register`, {
      user_id: Number(userId),
    });
  },

  cancelRegistration: (registrationId: string) => {
    return axiosClient.patch(`/events/registrations/${registrationId}/cancel`);
  },

  isUserRegistered: async (
    eventId: string,
    userId: string | number
  ): Promise<boolean> => {
    try {
      const response = await axiosClient.get(
        `/events/${eventId}/registrations`
      );
      const registrations: Registration[] = response.data.registrations || [];
      return registrations.some(
        (registration) =>
          registration.user_id === Number(userId) &&
          registration.status === "registered"
      );
    } catch (error) {
      console.error("Error checking registration status:", error);
      return false;
    }
  },
};

export default eventsApi;
