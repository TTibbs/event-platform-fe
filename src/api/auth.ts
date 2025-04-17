import axiosClient from "@/api/axiosClient";
import { RegisterParams, LoginParams, RefreshTokenParams } from "@/types/auth";

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
