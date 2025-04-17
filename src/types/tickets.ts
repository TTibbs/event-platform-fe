// Ticket type definitions

export interface Ticket {
  id: number;
  event_id: number;
  user_id: number;
  registration_id: number;
  paid: boolean;
  ticket_code: string;
  issued_at: string;
  used_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VerifiedTicket extends Ticket {
  event_title: string;
  start_time: string;
  end_time: string;
  location: string;
  username: string;
  email: string;
}

export interface CreateTicketParams {
  event_id: number;
  user_id: number;
  registration_id: number;
  paid: boolean;
  [key: string]: any;
}

export interface UpdateTicketParams {
  paid?: boolean;
  status?: string;
  [key: string]: any;
}
