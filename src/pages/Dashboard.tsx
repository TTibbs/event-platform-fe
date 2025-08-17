import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { DashboardSidebar, useDashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { Edit } from "lucide-react";
import teamsApi from "@/api/teams";
import { toast } from "sonner";
import TeamMember from "@/components/dashboard/TeamMember";

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    teamDraftEvents,
    teamEvents,
    teamMembers,
    loading,
    error,
    user,
    teamId,
  } = useDashboard();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Get active section from URL params, default to "all-events"
  const activeSection = searchParams.get("section") || "all-events";

  // Function to update active section
  const setActiveSection = (section: string) => {
    setSearchParams({ section });
  };

  // Fetch user's team role from the teams array in the user object
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!authUser?.id) return;

      try {
        setRoleLoading(true);

        // Check if user has teams in auth context
        if (authUser.teams && authUser.teams.length > 0) {
          // Find the team that matches the current teamId
          const currentTeam = authUser.teams.find(
            (team) => team.team_id === teamId
          );
          if (currentTeam) {
            setUserRole(currentTeam.role);
            return;
          }
        }

        // Fallback to API call if not found in user object
        const response = await teamsApi.getMemberRoleByUserId(
          authUser.id.toString()
        );
        setUserRole(response.data.role);
      } catch (err) {
        console.error("Failed to fetch user role:", err);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [authUser?.id, authUser?.teams, teamId]);

  // Check if user can edit events
  const canEditEvents =
    userRole && ["team_admin", "event_manager"].includes(userRole);

  // Check if user can delete team members
  const canDeleteTeamMembers = userRole && ["team_admin"].includes(userRole);

  // Navigate to create event page when that section is selected
  useEffect(() => {
    if (activeSection === "create-event") {
      navigate("/events/create");
      // Reset the section to all-events after navigation
      setSearchParams({ section: "all-events" });
    }
  }, [activeSection, navigate, setSearchParams]);

  // Navigate to edit event page
  const handleEditEvent = (eventId: number) => {
    navigate(`/events/edit/${eventId}`);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "team_admin":
        return "bg-red-500";
      case "event_manager":
        return "bg-blue-500";
      case "owner":
        return "bg-purple-500";
      case "organizer":
        return "bg-green-500";
      default:
        return "bg-slate-500";
    }
  };

  // Handle deleting a team member
  const handleDeleteTeamMember = async (memberId: number) => {
    if (!teamId) return;

    try {
      setIsDeleting(memberId.toString());
      await teamsApi.deleteTeamMember(teamId.toString(), memberId.toString());
      toast.success("Team member removed successfully");

      // Refresh the page to show updated team members
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete team member:", err);
      toast.error("Failed to remove team member");
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error.message || "Failed to load dashboard data"}</p>
      </div>
    );
  }

  // Render team members section
  const renderTeamMembers = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Members</h2>
      </div>

      {teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <TeamMember
              key={member.id}
              member={member}
              getRoleBadgeColor={getRoleBadgeColor}
              canDeleteTeamMembers={canDeleteTeamMembers || false}
              handleDeleteTeamMember={handleDeleteTeamMember}
              isDeleting={isDeleting || ""}
              authUser={authUser || { id: 0 }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">No team members found.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-64 md:pb-44">
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-240px)]">
          <DashboardSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div className="flex-1 p-6 overflow-auto">
            {/* Display based on active section */}
            {activeSection === "team-members" ? (
              renderTeamMembers()
            ) : activeSection === "draft-events" ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Draft Events</h2>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate("/events/create")}
                  >
                    Create New Event
                  </Button>
                </div>

                {teamDraftEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {teamDraftEvents.map((event) => (
                      <div key={event.id} className="relative">
                        <EventCard
                          event={event}
                          userId={user?.id}
                          variant="dashboard"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {canEditEvents && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-2 h-9 bg-background/80 backdrop-blur-sm cursor-pointer"
                              onClick={() => handleEditEvent(event.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted border border-border rounded-md p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      You don't have any draft events.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">All Events</h2>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate("/events/create")}
                  >
                    Create New Event
                  </Button>
                </div>
                {teamEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {teamEvents.map((event) => (
                      <div key={event.id} className="relative">
                        <EventCard
                          event={event}
                          userId={user?.id}
                          variant="dashboard"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                          {canEditEvents && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-2 h-9 bg-background/80 backdrop-blur-sm cursor-pointer"
                              onClick={() => handleEditEvent(event.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted border border-border rounded-md p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      No events found.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
