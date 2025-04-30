import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import { Event } from "@/types/events";

export function useDashboard() {
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [teamId, setTeamId] = useState<number | null>(null);
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Check if user is a member of any team
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (!user?.id) return;

      try {
        const response = await teamsApi.getMemberByUserId(user.id.toString());
        // If we get a successful response, the user is a team member
        if (response.data && response.data.teamMember) {
          const teamMemberData = response.data.teamMember;
          setIsTeamMember(true);
          setTeamId(teamMemberData.team_id);

          // Update user data with team information
          updateUserData({ teamId: teamMemberData.team_id });
        } else {
          setIsTeamMember(false);
          navigate("/profile");
        }
      } catch (err) {
        // If we get an error, user is not a team member
        setIsTeamMember(false);
        // Redirect non-team members to profile page
        navigate("/profile");
      }
    };

    checkTeamMembership();
  }, [user, navigate, updateUserData]);

  // Fetch draft events when teamId is available
  useEffect(() => {
    const fetchDraftEvents = async () => {
      if (!isTeamMember || !teamId) return;

      setLoading(true);
      try {
        const response = await eventsApi.getTeamDraftEvents(teamId.toString());
        setDraftEvents(response.data.events || []);
      } catch (err: any) {
        setError(
          err instanceof Error
            ? err
            : new Error(err?.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDraftEvents();
  }, [isTeamMember, teamId]);

  // Fetch all events when user is a team member
  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!isTeamMember) return;

      setLoading(true);
      try {
        const response = await eventsApi.getAllEvents();
        setAllEvents(response.data.events || []);
      } catch (err: any) {
        setError(
          err instanceof Error
            ? err
            : new Error(err?.message || "Unknown error")
        );
      } finally {
        setLoading(false);
      }
    };

    if (isTeamMember) {
      fetchAllEvents();
    }
  }, [isTeamMember]);

  return {
    draftEvents,
    allEvents,
    loading,
    error,
    isTeamMember,
    activeSection,
    setActiveSection,
    teamId,
    user,
  };
}
