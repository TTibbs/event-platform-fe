import axiosClient from "@/api/axiosClient";
import {
  UpdateUserParams,
  CreateUserParams,
  PromoteToAdminParams,
} from "@/types/users";

const usersApi = {
  getAllUsers: () => {
    return axiosClient.get("/users");
  },

  getUserById: (id: string) => {
    return axiosClient.get(`/users/${id}`);
  },

  getIsSiteAdmin: (id: string) => {
    return axiosClient.get(`/users/${id}/is-site-admin`);
  },

  getUserByUsername: (username: string) => {
    return axiosClient.get(`/users/username/${username}`);
  },

  getUserByEmail: (email: string) => {
    return axiosClient.get(`/users/email/${email}`);
  },

  getUserEventRegistrations: (id: string) => {
    return axiosClient.get(`/users/${id}/registrations`);
  },

  createUser: (params: CreateUserParams) => {
    return axiosClient.post("/users", params);
  },

  updateUser: (id: string, params: UpdateUserParams) => {
    return axiosClient.patch(`/users/${id}`, params);
  },

  promoteToAdmin: (id: string, params: PromoteToAdminParams) => {
    return axiosClient.patch(`/admin/users/${id}`, params);
  },

  deleteUser: (id: string) => {
    return axiosClient.delete(`/users/${id}`);
  },

  // New endpoint for admin dashboard that consolidates all data in one call
  getAdminDashboardData: () => {
    return axiosClient.get("/admin/dashboard");
  },
};

export default usersApi;
