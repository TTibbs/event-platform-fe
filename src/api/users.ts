import axiosClient from "@/api/axiosClient";

interface UpdateUserParams {
  [key: string | number]: any;
}

const usersApi = {
  getAllUsers: () => {
    return axiosClient.get("/users");
  },

  getUserById: (id: string) => {
    return axiosClient.get(`/users/${id}`);
  },

  getUserByUsername: (username: string) => {
    return axiosClient.get(`/users/username/${username}`);
  },

  getUserByEmail: (email: string) => {
    return axiosClient.get(`/users/email/${email}`);
  },

  updateUser: (id: string, params: UpdateUserParams) => {
    return axiosClient.patch(`/users/${id}`, params);
  },

  deleteUser: (id: string) => {
    return axiosClient.delete(`/users/${id}`);
  },
};

export default usersApi;
