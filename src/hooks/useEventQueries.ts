import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import ticketsApi from "@/api/tickets";
import { Event } from "@/types/events";
import { useDebounce } from "./useDebounce";
import { useState, useEffect } from "react";

// Key factory for React Query
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...eventKeys.lists(), filters] as const,
  categories: () => [...eventKeys.all, "categories"] as const,
  search: (query: string) => [...eventKeys.all, "search", query] as const,
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

export type EventsFilters = {
  sortBy: string;
  sortOrder: string;
  category?: string;
  page: number;
  limit: number;
};

export function useEvents(filters: EventsFilters) {
  // Convert UI sort values to valid API parameters
  let apiSortBy = filters.sortBy;
  let apiSortOrder = filters.sortOrder;

  // Ensure only valid sort values are passed to API
  const validSortBy = ["start_time", "price", "location", "max_attendees"];

  // For title sorting, we need to use client-side sorting as the API doesn't support it
  const needsClientSort = apiSortBy === "title";

  // If not a valid sort field, default to start_time
  if (!validSortBy.includes(apiSortBy) && !needsClientSort) {
    apiSortBy = "start_time";
  }

  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: async () => {
      const response = await eventsApi.getAllEvents(
        needsClientSort ? "start_time" : apiSortBy,
        apiSortOrder,
        filters.limit,
        filters.page,
        filters.category === "All" ? undefined : filters.category
      );

      let events = response.data.events || [];

      // Apply client-side sorting for title if needed
      if (needsClientSort && events.length > 0) {
        events = sortEvents(events, "title", apiSortOrder);
      }

      return {
        events,
        totalPages: response.data.total_pages || 1,
        totalEvents: response.data.total_events || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEventCategories() {
  return useQuery({
    queryKey: eventKeys.categories(),
    queryFn: () =>
      eventsApi
        .getEventCategories()
        .then((response) => response.data.categories || []),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useEventSearch(
  searchQuery: string,
  options?: {
    categoryFilter?: string;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [localResults, setLocalResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get all events for client-side filtering
  const allEventsQuery = useQuery({
    queryKey: eventKeys.lists(),
    queryFn: () =>
      eventsApi
        .getAllEvents(
          "start_time",
          "asc",
          100, // Fetch a larger set for client-side filtering
          1
        )
        .then((response) => response.data.events || []),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setIsSearching(false);
      setLocalResults([]);
      return;
    }

    setIsSearching(true);

    if (allEventsQuery.data) {
      const searchTerm = debouncedQuery.toLowerCase();

      // Filter the events based on search query
      let results = allEventsQuery.data.filter(
        (event: Event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.location.toLowerCase().includes(searchTerm)
      );

      // Apply category filter if needed
      if (options?.categoryFilter && options.categoryFilter !== "All") {
        results = results.filter(
          (event: Event) => event.category === options.categoryFilter
        );
      }

      // Apply sorting
      if (options?.sortBy && options?.sortOrder) {
        results = sortEvents(results, options.sortBy, options.sortOrder);
      }

      setLocalResults(results);
    }
  }, [
    debouncedQuery,
    allEventsQuery.data,
    options?.categoryFilter,
    options?.sortBy,
    options?.sortOrder,
  ]);

  return {
    results: localResults,
    isSearching: debouncedQuery.trim().length > 0 && isSearching,
    isLoading: allEventsQuery.isLoading,
  };
}

// Helper function to sort events client-side
function sortEvents(events: Event[], sortBy: string, sortOrder: string) {
  return [...events].sort((a, b) => {
    if (sortBy === "title") {
      const comparison = a.title.localeCompare(b.title);
      return sortOrder === "asc" ? comparison : -comparison;
    } else if (sortBy === "price") {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
    } else if (sortBy === "start_time") {
      const dateA = new Date(a.start_time).getTime();
      const dateB = new Date(b.start_time).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortBy === "location") {
      const comparison = a.location.localeCompare(b.location);
      return sortOrder === "asc" ? comparison : -comparison;
    } else if (sortBy === "max_attendees") {
      return sortOrder === "asc"
        ? a.max_attendees - b.max_attendees
        : b.max_attendees - a.max_attendees;
    }
    return 0;
  });
}

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
