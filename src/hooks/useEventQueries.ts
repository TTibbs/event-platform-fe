import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import ticketsApi from "@/api/tickets";
import { Event } from "@/types/events";

// Key factory for React Query
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (id: number | string) => [...eventKeys.details(), id] as const,
  registrations: (id: number | string) =>
    [...eventKeys.detail(id), "registrations"] as const,
  userRegistrationStatus: (eventId: number | string, userId: number | string) =>
    [...eventKeys.detail(eventId), "registered", userId] as const,
  userTicketStatus: (eventId: number | string, userId: number | string) =>
    [...eventKeys.detail(eventId), "ticket", userId] as const,
  editPermission: (eventId: number | string, userId: number | string) =>
    [...eventKeys.detail(eventId), "permissions", "edit", userId] as const,
};

export function useEvent(eventId: string | number) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () =>
      eventsApi
        .getEventById(eventId.toString())
        .then((response) => response.data.event),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEventRegistrationStatus(
  eventId: string | number,
  userId?: string | number
) {
  return useQuery({
    queryKey: eventKeys.userRegistrationStatus(eventId, userId || "anonymous"),
    queryFn: () => {
      if (!userId) return Promise.resolve(false);
      return eventsApi.isUserRegistered(eventId.toString(), userId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}

export function useEventTicketStatus(
  eventId: string | number,
  userId?: string | number
) {
  return useQuery({
    queryKey: eventKeys.userTicketStatus(eventId, userId || "anonymous"),
    queryFn: () => {
      if (!userId) return Promise.resolve(false);
      return ticketsApi.hasUserPaidForEvent(
        userId.toString(),
        eventId.toString()
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}

export function useRegisterForEvent(eventId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string | number) =>
      eventsApi.registerForEvent(eventId.toString(), userId),
    onSuccess: (_, userId) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: eventKeys.userRegistrationStatus(eventId, userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.registrations(eventId),
      });
    },
  });
}

export function useEventEditPermission(
  eventId: string | number,
  userId?: string | number
) {
  return useQuery({
    queryKey: eventKeys.editPermission(eventId, userId || "anonymous"),
    queryFn: async () => {
      if (!userId) return false;

      try {
        // Check from local storage cache first
        const permissionCacheKey = `edit_permission_${userId}_${eventId}`;
        const cachedPermission = localStorage.getItem(permissionCacheKey);
        const cacheTimestampKey = `edit_permission_timestamp_${userId}_${eventId}`;
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
        const cacheExpiry = 30 * 60 * 1000; // 30 minutes

        // Use cache if valid and not expired
        if (cachedPermission !== null && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();

          if (now - timestamp < cacheExpiry) {
            return cachedPermission === "true";
          }
        }

        // Get event details to check created_by
        const eventResponse = await eventsApi.getEventById(eventId.toString());
        const event = eventResponse.data.event as Event;

        // Get user details
        const userResponse = await usersApi.getUserById(userId.toString());
        const userData = userResponse.data.user;

        // Check if user is creator or site admin
        if (
          Number(userId) === Number(event.created_by) ||
          userData.username === event.creator_username ||
          userData.is_site_admin
        ) {
          localStorage.setItem(permissionCacheKey, "true");
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          return true;
        }

        // Only check team membership if user has teams
        if (userData.has_teams === false) {
          localStorage.setItem(permissionCacheKey, "false");
          localStorage.setItem(cacheTimestampKey, Date.now().toString());
          return false;
        }

        // Check team membership role
        const membershipResponse = await teamsApi.getMemberByUserId(
          userId.toString()
        );
        const memberships = membershipResponse.data.team_members || [];

        // Check if user has edit permission in the event's team
        const hasEditPermission = memberships.some(
          (membership: any) =>
            membership.team_id === event.team_id &&
            ["team_admin", "owner", "organizer", "event_manager"].includes(
              membership.role
            )
        );

        localStorage.setItem(permissionCacheKey, hasEditPermission.toString());
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        return hasEditPermission;
      } catch (error) {
        console.error("Failed to check user permissions:", error);
        return false;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}
