import axiosClient from "@/api/axiosClient";

interface RegisterParams {
  username: string;
  email: string;
  password: string;
  isEventOrganiser?: boolean;
  teamName?: string;
  teamDescription?: string;
}

interface LoginParams {
  username: string;
  password: string;
}

interface RefreshTokenParams {
  refreshToken: string;
}

const authApi = {
  register: (params: RegisterParams) => {
    return axiosClient.post("/auth/register", params);
  },

  login: (params: LoginParams) => {
    return axiosClient.post("/auth/login", params);
  },

  refreshToken: (params: RefreshTokenParams) => {
    return axiosClient.post("/auth/refresh-token", params);
  },

  logout: (refreshToken: string) => {
    return axiosClient.post("/auth/logout", { refreshToken });
  },
};

export default authApi;
