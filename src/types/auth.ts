// Auth type definitions

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  isEventOrganiser?: boolean;
  teamName?: string;
  teamDescription?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}
