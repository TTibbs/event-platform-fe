import axiosClient from "@/api/axiosClient";
import { UpdateUserParams } from "@/types/users";

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

  updateUser: (id: string, params: UpdateUserParams) => {
    return axiosClient.patch(`/users/${id}`, params);
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
