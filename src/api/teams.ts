import axiosClient from "@/api/axiosClient";
import { CreateTeamParams, AddMemberParams } from "@/types/teams";

const teamsApi = {
  getAllTeams: () => {
    return axiosClient.get("/teams");
  },

  getTeamById: (id: string) => {
    return axiosClient.get(`/teams/${id}`);
  },

  getTeamByName: (name: string) => {
    return axiosClient.get(`/teams/name/${name}`);
  },

  getTeamMembers: (id: string) => {
    return axiosClient.get(`/teams/${id}/members`);
  },

  getAllTeamMembers: () => {
    return axiosClient.get("/teams/members");
  },

  getMemberById: (id: string) => {
    return axiosClient.get(`/teams/members/${id}`);
  },

  getMemberRoleByUserId: (userId: string) => {
    return axiosClient.get(`/teams/members/${userId}/role`);
  },

  getMemberByUserId: async (userId: string) => {
    try {
      return await axiosClient.get(`/teams/members/user/${userId}`);
    } catch (error: any) {
      // If the error is a 404 (user has no teams), return an empty result instead of throwing
      if (error.response?.status === 404) {
        return {
          data: {
            team_members: [],
            message: "User is not a member of any teams",
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        };
      }
      // Re-throw other errors
      throw error;
    }
  },

  createTeam: (params: CreateTeamParams) => {
    return axiosClient.post("/teams", params);
  },

  updateTeam: (id: string, name: string) => {
    return axiosClient.patch(`/teams/${id}`, { name });
  },

  deleteTeam: (id: string) => {
    return axiosClient.delete(`/teams/${id}`);
  },

  deleteTeamMember: (teamId: string, memberId: string) => {
    return axiosClient.delete(`/teams/${teamId}/members/${memberId}`);
  },

  addTeamMember: (params: AddMemberParams) => {
    return axiosClient.post("/teams/members", params);
  },
};

export default teamsApi;
