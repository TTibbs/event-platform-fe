import axiosClient from "@/api/axiosClient";
import {
  CreateEventParams,
  UpdateEventParams,
  Registration,
} from "@/types/events";

const eventsApi = {
  getAllEvents: (
    sort_by: string = "start_time",
    order: string = "asc",
    limit: number = 10,
    page: number = 1,
    category?: string
  ) => {
    const params: Record<string, any> = {
      sort_by,
      order,
      limit,
      page,
    };

    if (category) {
      params.category = category;
    }

    return axiosClient.get("/events", { params });
  },

  getPastEvents: () => {
    return axiosClient.get("/events/past");
  },

  getEventCategories: () => {
    return axiosClient.get(`/events/categories`);
  },

  getEventCategoryByName: (name: string) => {
    return axiosClient.get(`/events/categories/${name}`);
  },

  getDraftEvents: () => {
    return axiosClient.get("/events/draft");
  },

  getDraftEventById: (id: string) => {
    return axiosClient.get(`/events/${id}/draft`);
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
