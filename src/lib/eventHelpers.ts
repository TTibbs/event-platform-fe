// Update URL when filters change
export const updateUrlParams = (
  updates: Record<string, string>,
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams) => void
) => {
  const newParams = new URLSearchParams(searchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (
      value &&
      value !== "All" &&
      value !== "start_time" &&
      value !== "asc" &&
      value !== "6"
    ) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
  });

  setSearchParams(newParams);
};

// Helper to convert UI sort value to API parameters
export function getSortParamsFromValue(sortValue: string): [string, string] {
  switch (sortValue) {
    case "A-Z":
      return ["title", "asc"];
    case "Z-A":
      return ["title", "desc"];
    case "price_low":
      return ["price", "asc"];
    case "price_high":
      return ["price", "desc"];
    case "newest":
      return ["start_time", "asc"];
    case "oldest":
      return ["start_time", "desc"];
    case "location":
      return ["location", "asc"];
    case "capacity":
      return ["max_attendees", "desc"];
    default:
      return ["start_time", "asc"];
  }
}

// Helper to convert API parameters to UI sort value
export function getSortValueFromParams(sortBy: string, order: string): string {
  if (sortBy === "title" && order === "asc") return "A-Z";
  if (sortBy === "title" && order === "desc") return "Z-A";
  if (sortBy === "price" && order === "asc") return "price_low";
  if (sortBy === "price" && order === "desc") return "price_high";
  if (sortBy === "start_time" && order === "asc") return "newest";
  if (sortBy === "start_time" && order === "desc") return "oldest";
  if (sortBy === "location") return "location";
  if (sortBy === "max_attendees") return "capacity";
  return "newest"; // Default
}
