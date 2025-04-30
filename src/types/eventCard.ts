import { Event } from "./events";

// Define a simplified user interface for auth context
export interface AuthUser {
  id: number;
  username: string;
  role?: string;
  is_site_admin?: boolean;
}

export type EventCardVariant = "default" | "dashboard" | "compact";

export interface EventCardOptions {
  showImage?: boolean;
  showCategory?: boolean;
  showLocation?: boolean;
  showDescription?: boolean;
  showTimeDetails?: boolean;
  showPriceDetails?: boolean;
  showCreatorInfo?: boolean;
  showActionButtons?: boolean;
  fixedHeight?: boolean;
  imageHeight?: string;
  titleLines?: number;
  descriptionLines?: number;
  titleOverlay?: boolean;
}

export interface EventProps {
  event: Event;
  userId?: string | number;
  className?: string;
  variant?: EventCardVariant;
  options?: EventCardOptions;
}
