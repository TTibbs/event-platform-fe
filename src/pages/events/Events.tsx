import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { EventsList } from "@/components/events/EventsList";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  useEvents,
  useEventCategories,
  useEventSearch,
} from "@/hooks/useEventQueries";
import {
  getSortValueFromParams,
  getSortParamsFromValue,
  updateUrlParams,
} from "@/lib/eventHelpers";

export default function Events() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Get URL parameters with defaults
  const categoryFilter = searchParams.get("category") || "All";
  const sortBy = searchParams.get("sort_by") || "start_time";
  const sortOrder = searchParams.get("order") || "asc";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = parseInt(searchParams.get("perPage") || "6", 10);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Determine UI sort value for display
  const sortValue = getSortValueFromParams(sortBy, sortOrder);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useEventCategories();

  // Fetch paginated events with filters
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError,
    error,
  } = useEvents({
    sortBy,
    sortOrder,
    category: categoryFilter,
    page: currentPage,
    limit: itemsPerPage,
  });

  // Search functionality using client-side filtering
  const {
    results: searchResults,
    isSearching,
    isLoading: isSearchLoading,
  } = useEventSearch(searchQuery, {
    categoryFilter,
    sortBy,
    sortOrder,
  });

  const handleCategoryChange = (value: string) => {
    updateUrlParams(
      { category: value, page: "1" },
      searchParams,
      setSearchParams
    );
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newOrder] = getSortParamsFromValue(value);
    updateUrlParams(
      {
        sort_by: newSortBy,
        order: newOrder,
        page: "1",
      },
      searchParams,
      setSearchParams
    );
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handlePageChange = (page: number) => {
    const totalPages = eventsData?.totalPages || 1;
    if (page < 1 || page > totalPages) return;

    // Clear search when changing pages
    if (searchQuery) {
      setSearchQuery("");
    }

    updateUrlParams({ page: page.toString() }, searchParams, setSearchParams);
  };

  const handleItemsPerPageChange = (value: string) => {
    updateUrlParams(
      { perPage: value, page: "1" },
      searchParams,
      setSearchParams
    );
  };

  // Loading state
  if ((isEventsLoading || isCategoriesLoading) && !isSearching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{(error as Error)?.message || "Failed to load events"}</p>
      </div>
    );
  }

  // Determine which events to display
  const eventsToDisplay = isSearching
    ? searchResults
    : eventsData?.events || [];
  const totalEvents = isSearching
    ? searchResults.length
    : eventsData?.totalEvents || 0;
  const totalPages = isSearching ? 1 : eventsData?.totalPages || 1;

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
      if (i <= 1 || i >= totalPages) continue;
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
    <div className="container mx-auto px-4 py-6 md:py-8">
      <section className="mb-6 md:mb-8">
        <div className="flex flex-col space-y-4 md:space-y-6">
          {/* Filters */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3 md:items-center">
              <div className="relative w-full md:w-64 lg:w-80">
                <label htmlFor="search-input" className="sr-only">
                  Search
                </label>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search events"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  aria-label="Search events"
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
              <div className="grid grid-cols-2 gap-2 md:flex md:space-x-2">
                <Select
                  onValueChange={handleCategoryChange}
                  value={categoryFilter}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(
                      (category: { id: number; name: string }) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <Select onValueChange={handleSortChange} value={sortValue}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Order by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A-Z">Name (A-Z)</SelectItem>
                    <SelectItem value="Z-A">Name (Z-A)</SelectItem>
                    <SelectItem value="price_low">
                      Price (Low to High)
                    </SelectItem>
                    <SelectItem value="price_high">
                      Price (High to Low)
                    </SelectItem>
                    <SelectItem value="newest">Date (Nearest First)</SelectItem>
                    <SelectItem value="oldest">
                      Date (Furthest First)
                    </SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="capacity">Capacity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Event count and pagination controls */}
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center">
            <div
              className="text-sm text-muted-foreground text-center md:text-left order-2 md:order-1"
              aria-live="polite"
            >
              {isSearching ? (
                <span>Found {searchResults.length} matching events</span>
              ) : (
                <span>
                  Showing{" "}
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalEvents)}{" "}
                  to {Math.min(currentPage * itemsPerPage, totalEvents)} of{" "}
                  {totalEvents} events
                </span>
              )}
            </div>

            {/* Only hide pagination when actively searching */}
            {!isSearching && totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center gap-2 order-1 md:order-2">
                <Select
                  onValueChange={handleItemsPerPageChange}
                  defaultValue={itemsPerPage.toString()}
                >
                  <SelectTrigger className="w-full md:w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 per page</SelectItem>
                    <SelectItem value="12">12 per page</SelectItem>
                    <SelectItem value="24">24 per page</SelectItem>
                  </SelectContent>
                </Select>
                <Pagination role="navigation" aria-label="Pagination">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                        aria-label="Previous page"
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
                        aria-label="Next page"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 min-h-[300px]">
        {/* Show loading indicator when searching */}
        {isSearchLoading && (
          <div className="flex justify-center my-8" aria-live="assertive">
            <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        )}

        {/* Show events */}
        {!isSearchLoading && eventsToDisplay.length > 0 ? (
          <EventsList events={eventsToDisplay} userId={user?.id} />
        ) : (
          !isSearchLoading &&
          !isEventsLoading && (
            <div
              className="flex flex-col items-center justify-center py-12"
              aria-live="polite"
            >
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
    </div>
  );
}
