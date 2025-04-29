import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import eventsApi from "@/api/events";
import { EventsList } from "@/components/events/EventsList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/events";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Category = {
  id: number;
  name: string;
};

export default function Events() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("start_time");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [sortSelectValue, setSortSelectValue] = useState<string>("newest");
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  // Get current user ID (if authenticated)
  const currentUserId = user?.id;

  // Fetch all available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await eventsApi.getEventCategories();
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch all events for searching (limit to 100)
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await eventsApi.getAllEvents(
          "start_time",
          "asc",
          100, // Get a large number of events for search
          1
        );
        setAllEvents(response.data.events || []);
      } catch (err) {
        console.error("Failed to fetch all events for search:", err);
      }
    };

    fetchAllEvents();
  }, []);

  // Add new effect for fetching past events
  useEffect(() => {
    if (!showPastEvents) return;

    const fetchPastEvents = async () => {
      try {
        setLoading(true);
        const response = await eventsApi.getPastEvents();
        setEvents(response.data.events || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalEvents(response.data.events?.length || 0);
      } catch (err: any) {
        setError(err?.message || "Failed to load past events");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, [showPastEvents]);

  // Modify existing events fetch effect
  useEffect(() => {
    // Don't fetch paginated events if we're searching or showing past events
    if (isSearching || showPastEvents) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Only pass valid sortBy values to the API
        const validSortBy = [
          "start_time",
          "price",
          "location",
          "max_attendees",
        ];
        const validOrder = ["asc", "desc"];

        const apiSortBy = validSortBy.includes(sortBy) ? sortBy : "start_time";
        const apiOrder = validOrder.includes(sortOrder) ? sortOrder : "asc";

        const category = categoryFilter !== "All" ? categoryFilter : undefined;

        const response = await eventsApi.getAllEvents(
          apiSortBy,
          apiOrder,
          itemsPerPage,
          currentPage,
          category
        );

        setEvents(response.data.events || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalEvents(response.data.total_events || 0);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Failed to load events");
        console.error(err);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [
    sortBy,
    sortOrder,
    categoryFilter,
    currentPage,
    itemsPerPage,
    isSearching,
    showPastEvents,
  ]);

  // Apply search filter client-side with improved state transitions
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Skip empty searches
    if (!searchQuery.trim()) {
      if (isSearching) {
        // Only reset if we were previously searching
        setIsSearching(false);
        setSearchResults([]);
        setIsSearchLoading(false);
      }
      return;
    }

    // Show loading state but don't change isSearching yet to avoid UI jumps
    setIsSearchLoading(true);

    // Set a timeout to avoid searching on every keystroke
    searchTimeoutRef.current = setTimeout(() => {
      const searchTerm = searchQuery.toLowerCase();

      // Filter from all events instead of just the current page
      const results = allEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.location.toLowerCase().includes(searchTerm)
      );

      // Apply category filter if needed
      const categoryFiltered =
        categoryFilter !== "All"
          ? results.filter((event) => event.category === categoryFilter)
          : results;

      // Apply sorting
      let sorted = [...categoryFiltered];

      // Sort based on current sort settings
      if (sortBy === "title") {
        sorted = sorted.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title);
          return sortOrder === "asc" ? comparison : -comparison;
        });
      } else if (sortBy === "price") {
        sorted = sorted.sort((a, b) => {
          return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
        });
      } else if (sortBy === "start_time") {
        sorted = sorted.sort((a, b) => {
          const dateA = new Date(a.start_time).getTime();
          const dateB = new Date(b.start_time).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
      } else if (sortBy === "location") {
        sorted = sorted.sort((a, b) => {
          const comparison = a.location.localeCompare(b.location);
          return sortOrder === "asc" ? comparison : -comparison;
        });
      } else if (sortBy === "max_attendees") {
        sorted = sorted.sort((a, b) => {
          return sortOrder === "asc"
            ? a.max_attendees - b.max_attendees
            : b.max_attendees - a.max_attendees;
        });
      }

      // First update the results while keeping isSearchLoading true
      setSearchResults(sorted);

      // After a very short delay to allow rendering of results, update search state
      // This makes the transition smoother
      setTimeout(() => {
        setIsSearching(true);
        setIsSearchLoading(false);
      }, 50);
    }, 300); // 300ms delay for debouncing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, allEvents, categoryFilter, sortBy, sortOrder]);

  // Update handleSearchChange to avoid unnecessary loading state changes for very short inputs
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Only set loading for searches with 2+ characters to avoid flickering for single letter inputs
    if (value.trim().length > 1) {
      setIsSearchLoading(true);
    }
  };

  // Initialize state from URL parameters
  useEffect(() => {
    const category = searchParams.get("category") || "All";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "6", 10);

    setCategoryFilter(category);
    setSortSelectValue(sort);
    setCurrentPage(page);
    setItemsPerPage(perPage);

    // Apply sort settings based on URL parameter
    handleSortChange(sort);
  }, []);

  // Update URL when filters change
  const updateUrlParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "All" && value !== "newest" && value !== "6") {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  };

  const handleCategoryChange = (value: string) => {
    // Reset to page 1 when changing category
    setCurrentPage(1);
    setCategoryFilter(value);
    updateUrlParams({ category: value, page: "1" });
  };

  const handleSortChange = (value: string) => {
    // Reset to page 1 when changing sort
    setCurrentPage(1);

    // Update the select value immediately
    setSortSelectValue(value);

    // Update URL
    updateUrlParams({ sort: value, page: "1" });

    if (value === "A-Z") {
      // Handle alphabetical sorting client-side since title isn't a valid sortBy param for API
      setSortBy("title");
      setSortOrder("asc");
    } else if (value === "Z-A") {
      setSortBy("title");
      setSortOrder("desc");
    } else if (value === "price_low") {
      setSortBy("price");
      setSortOrder("asc");
    } else if (value === "price_high") {
      setSortBy("price");
      setSortOrder("desc");
    } else if (value === "newest") {
      setSortBy("start_time");
      setSortOrder("asc");
    } else if (value === "oldest") {
      setSortBy("start_time");
      setSortOrder("desc");
    } else if (value === "location") {
      setSortBy("location");
      setSortOrder("asc");
    } else if (value === "capacity") {
      setSortBy("max_attendees");
      setSortOrder("desc");
    }
  };

  // Update the clear search function to maintain focus
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setIsSearchLoading(false);
    setSearchResults([]);

    // Maintain focus on the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    // Clear search when changing pages
    if (searchQuery) {
      setSearchQuery("");
      setIsSearching(false);
      setIsSearchLoading(false);
      setSearchResults([]);
    }

    setCurrentPage(page);
    updateUrlParams({ page: page.toString() });
  };

  const handleItemsPerPageChange = (value: string) => {
    setCurrentPage(1); // Reset to first page
    setItemsPerPage(Number(value));
    updateUrlParams({ perPage: value, page: "1" });
  };

  if (loading && !isSearching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Determine which events to display with fixed logic to avoid flicker
  const eventsToDisplay = isSearching ? searchResults : events;

  // Generate pagination items - show up to 5 page numbers at a time
  const renderPaginationItems = () => {
    const items = [];

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last pages as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {showPastEvents ? "Past Events" : "Find Your Next Event"}
          </h1>
          <div className="flex gap-2 ml-4">
            <Button
              variant={showPastEvents ? "outline" : "default"}
              onClick={() => {
                setShowPastEvents(false);
                setCurrentPage(1);
              }}
              className="cursor-pointer"
            >
              Upcoming Events
            </Button>
            <Button
              variant={showPastEvents ? "default" : "outline"}
              onClick={() => {
                setShowPastEvents(true);
                setCurrentPage(1);
              }}
              className="cursor-pointer"
            >
              <History className="mr-2 h-4 w-4" />
              Past Events
            </Button>
          </div>
        </div>

        {/* Only show filters for upcoming events */}
        {!showPastEvents && (
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search events"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pr-8 w-full"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  type="button"
                >
                  &times;
                </button>
              )}
            </div>
            <Select onValueChange={handleCategoryChange} value={categoryFilter}>
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={handleSortChange} value={sortSelectValue}>
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="Order by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-Z">Name (A-Z)</SelectItem>
                <SelectItem value="Z-A">Name (Z-A)</SelectItem>
                <SelectItem value="price_low">Price (Low to High)</SelectItem>
                <SelectItem value="price_high">Price (High to Low)</SelectItem>
                <SelectItem value="newest">Date (Nearest First)</SelectItem>
                <SelectItem value="oldest">Date (Furthest First)</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="capacity">Capacity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      {/* Top pagination and event count - more stable rendering */}
      <section className="mb-4 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {isSearching ? (
            <span>Found {searchResults.length} matching events</span>
          ) : (
            <span>
              Showing{" "}
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalEvents)} to{" "}
              {Math.min(currentPage * itemsPerPage, totalEvents)} of{" "}
              {totalEvents} events
            </span>
          )}
        </div>

        {/* Only hide pagination when actively searching with results, not during typing */}
        {(!isSearching || searchQuery.trim() === "") && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Select
              onValueChange={handleItemsPerPageChange}
              defaultValue={itemsPerPage.toString()}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 per page</SelectItem>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
              </SelectContent>
            </Select>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>

      {/* Events list with improved loading state */}
      <section className="mb-8 min-h-[300px]">
        {/* Show loading indicator when initially loading or actively searching */}
        {(loading || isSearchLoading) && (
          <div className="flex justify-center my-8">
            <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        )}

        {/* Only show events when not in a loading state */}
        {!loading && !isSearchLoading && eventsToDisplay.length > 0 ? (
          <EventsList events={eventsToDisplay} userId={currentUserId} />
        ) : (
          !loading &&
          !isSearchLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-medium mb-2">No events found</h2>
              <p className="text-muted-foreground">
                {isSearching
                  ? "Try adjusting your search terms"
                  : "Try changing your filters or check back later"}
              </p>
            </div>
          )
        )}
      </section>

      {/* Bottom pagination - only show when not searching and multiple pages */}
      {!isSearching && totalPages > 1 && (
        <section className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </section>
      )}
    </div>
  );
}
