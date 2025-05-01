import { Event } from "@/types/events";
import { ReactNode } from "react";
import { TeamResponse } from "./teams";
import { TeamMember } from "./teams";
import { User } from "./users";

export interface EventsManagementProps {
  events: Event[];
  totalEvents?: number;
  draftEventsCount?: number;
}

export interface ManagementBaseProps {
  title: string;
  description: string;
  addButtonLabel: string;
  addButtonIcon: ReactNode;
  onAddButtonClick?: () => void;
  loading: boolean;
  error: string | null;
  children: ReactNode;
}

export interface TeamsManagementProps {
  teams: TeamResponse[];
  teamMembers: TeamMember[];
  totalTeams?: number;
  totalTeamMembers?: number;
}

export interface TeamParams {
  name: string;
  description?: string;
}

export interface UsersManagementProps {
  users: User[];
  totalUsers?: number;
}

export interface AdminDashboardData {
  users: User[];
  teams: TeamResponse[];
  teamMembers: TeamMember[];
  events: Event[];
}

export interface ExtractedTeamMember {
  userId: number;
  teamId: number;
  username: string;
  email: string;
  role: string;
}

export interface StatsType {
  users: number;
  teams: number;
  events: number;
  teamMembers: number;
}
