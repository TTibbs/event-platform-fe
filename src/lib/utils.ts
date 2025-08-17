import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to convert relative image URLs to full URLs
export function getFullImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  // If it's already a full URL (starts with http), return as is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Get the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // For static files, we need to remove the /api suffix from the base URL
  // since static files are served at the root level, not under /api
  const baseUrl = API_BASE_URL?.endsWith("/api")
    ? API_BASE_URL.slice(0, -4) // Remove "/api" from the end
    : API_BASE_URL;

  // Ensure the imageUrl starts with a slash if it doesn't already
  const normalizedImageUrl = imageUrl.startsWith("/")
    ? imageUrl
    : `/${imageUrl}`;

  // Ensure the baseUrl doesn't end with a slash to avoid double slashes
  const normalizedBaseUrl = baseUrl?.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;

  return `${normalizedBaseUrl}${normalizedImageUrl}`;
}
