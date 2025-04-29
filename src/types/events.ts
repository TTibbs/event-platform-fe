// Event type definitions

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  price: number;
  max_attendees: number;
  status: "draft" | "published" | "cancelled" | string;
  category: string;
  creator_username: string;
  team_name: string;
  is_public: boolean;
  is_past: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  team_id: number;
  event_img_url?: string;
}

export interface EventDetail extends Omit<Event, "price"> {
  price: number | null;
  event_img_url?: string;
}

export interface EventsListProps {
  events: Event[];
  userId?: string | number;
}

export interface CreateEventParams {
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  price?: number;
  max_attendees?: number;
  event_type?: string;
  is_public?: boolean;
  team_id?: number;
  event_img_url?: string;
  [key: string]: any;
}

export interface UpdateEventParams {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  price?: number;
  max_attendees?: number;
  status?: "draft" | "published" | "cancelled";
  event_type?: string;
  is_public?: boolean;
  team_id?: number | string;
  event_img_url?: string;
}

export interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  registration_time: string;
  status: string;
  username: string;
  email: string;
}

// Extended registration interface with event details used in calendar
export interface EventRegistration extends Registration {
  start_time: string;
  end_time: string;
  event_title: string;
  event_description?: string;
  event_location?: string;
  event_status?: string;
  team_name?: string;
  event_img_url?: string;
}

export interface CardItem {
  id: number;
  title: string;
  description: string;
  content: React.ReactNode;
  footer: React.ReactNode;
}

export interface Category {
  id: number;
  name: string;
}
