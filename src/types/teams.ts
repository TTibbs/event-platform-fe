// Team type definitions

export interface Team {
  team_id: number;
  team_name: string;
  team_description: string;
  role: string; // Note: "admin" is now "team_admin" in the backend
}

export interface TeamMember {
  id: number;
  username: string;
  email: string;
  user_id: number;
  team_id: number;
  role: string; // Note: "admin" is now "team_admin" in the backend
  team_created_at: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamParams {
  name: string;
  description?: string;
  [key: string]: any;
}

export interface AddMemberParams {
  team_id: string;
  user_id?: string | number;
  role: string;
}
