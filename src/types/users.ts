// User type definitions

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  teams?: UserTeam[];
  role?: string;
}

export interface UpdateUserParams {
  username?: string;
  email?: string;
  [key: string | number]: any;
}

// Type representing the team information included in user responses
export interface UserTeam {
  team_id: number;
  team_name: string;
  team_description: string;
  role: string;
}
