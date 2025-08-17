import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import { Event } from "@/types/events";
import { TeamMember } from "@/types/teams";
import { UserTeam } from "@/types/users";

export function useDashboard() {
  const [teamDraftEvents, setTeamDraftEvents] = useState<Event[]>([]);
  const [teamEvents, setTeamEvents] = useState<Event[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Check if user is a member of any team
  useEffect(() => {
    let isMounted = true;

    const checkTeamMembership = async () => {
      if (!user?.id) return;

      // If user already has team data, use it instead of making API call
      if (user.teams && user.teams.length > 0) {
        const userTeam = user.teams[0]; // Assuming user is in one team
        setIsTeamMember(true);
        setTeamId(userTeam.team_id);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await teamsApi.getMemberByUserId(user.id.toString());
        // If we get a successful response, the user is a team member
        if (isMounted && response.data && response.data.teamMember) {
          const teamMemberData = response.data.teamMember;
          setIsTeamMember(true);
          setTeamId(teamMemberData.team_id);

          // Update user data with team information
          // Create a UserTeam object to comply with the User type
          const userTeam: UserTeam = {
            team_id: teamMemberData.team_id,
            team_name: teamMemberData.team_name || "",
            team_description: teamMemberData.team_description || "",
            role: teamMemberData.role || "",
          };

          updateUserData({ teams: [userTeam] });
        } else if (isMounted) {
          setIsTeamMember(false);
          navigate("/profile");
        }
      } catch (err) {
        // If we get an error, user is not a team member
        if (isMounted) {
          setIsTeamMember(false);
          // Redirect non-team members to profile page
          navigate("/profile");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkTeamMembership();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.teams, navigate]);

  // Fetch draft events when teamId is available
  useEffect(() => {
    let isMounted = true;

    const fetchTeamDraftEvents = async () => {
      if (!isTeamMember || !teamId) return;

      try {
        const response = await eventsApi.getTeamDraftEvents(teamId.toString());
        if (isMounted) {
          setTeamDraftEvents(response.data.events || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(err?.message || "Unknown error")
          );
        }
      }
    };

    fetchTeamDraftEvents();

    return () => {
      isMounted = false;
    };
  }, [teamId]); // Removed isTeamMember dependency since it's derived from teamId

  // Fetch all events when user is a team member
  useEffect(() => {
    let isMounted = true;

    const fetchTeamEvents = async () => {
      if (!teamId) return;

      try {
        const response = await eventsApi.getEventsByTeam(teamId.toString());
        if (isMounted) {
          setTeamEvents(response.data.events || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(err?.message || "Unknown error")
          );
        }
      }
    };

    fetchTeamEvents();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  // Fetch team members
  useEffect(() => {
    let isMounted = true;

    const fetchTeamMembers = async () => {
      if (!teamId) return;

      try {
        const response = await teamsApi.getTeamMembers(teamId.toString());
        if (isMounted) {
          setTeamMembers(response.data.members || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error(err?.message || "Unknown error")
          );
        }
      }
    };

    fetchTeamMembers();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  return {
    teamDraftEvents,
    teamEvents,
    loading,
    error,
    isTeamMember,
    teamId,
    teamMembers,
    user,
  };
}
