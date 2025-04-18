// User type definitions

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  profile_image_url?: string;
  teams?: UserTeam[];
  role?: string;
  is_site_admin?: boolean;
}

export interface UpdateUserParams {
  username?: string;
  email?: string;
  profile_image_url?: string;
  [key: string | number]: any;
}

export interface CreateUserParams {
  username: string;
  email: string;
  password: string;
}

export interface PromoteToAdminParams {
  is_site_admin: boolean;
}

// Type representing the team information included in user responses
export interface UserTeam {
  team_id: number;
  team_name: string;
  team_description: string;
  role: string; // Note: "admin" is now "team_admin" in the backend
}
