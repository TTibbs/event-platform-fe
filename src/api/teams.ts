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

  getMemberByUserId: (userId: string) => {
    return axiosClient.get(`/teams/members/user/${userId}`);
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

  addTeamMember: (params: AddMemberParams) => {
    return axiosClient.post("/teams/members", params);
  },
};

export default teamsApi;
