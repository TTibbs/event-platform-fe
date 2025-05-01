import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { DashboardSidebar, useDashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, User } from "lucide-react";
import teamsApi from "@/api/teams";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Dashboard() {
  const {
    teamDraftEvents,
    teamEvents,
    teamMembers,
    loading,
    error,
    activeSection,
    setActiveSection,
    user,
    teamId,
  } = useDashboard();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

  // Check if user can delete team members
  const canDeleteTeamMembers = userRole && ["team_admin"].includes(userRole);

  // Navigate to create event page when that section is selected
  useEffect(() => {
    if (activeSection === "create-event") {
      navigate("/events/create");
    }
  }, [activeSection, navigate]);

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

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
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
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{member.username}</CardTitle>
                    <CardDescription>
                      <Badge
                        className={`${getRoleBadgeColor(
                          member.role
                        )} text-white mt-1`}
                      >
                        {formatRole(member.role)}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Team joined:{" "}
                  {new Date(member.team_created_at).toLocaleDateString()}
                </p>
              </CardContent>
              {canDeleteTeamMembers && member.user_id !== authUser?.id && (
                <CardFooter>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTeamMember(member.user_id)}
                    disabled={isDeleting === member.user_id.toString()}
                  >
                    {isDeleting === member.user_id.toString()
                      ? "Removing..."
                      : "Remove"}
                  </Button>
                </CardFooter>
              )}
            </Card>
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
