import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { DashboardSidebar, useDashboard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { Edit } from "lucide-react";
import teamsApi from "@/api/teams";

export default function Dashboard() {
  const {
    teamDraftEvents,
    teamEvents,
    loading,
    error,
    activeSection,
    setActiveSection,
    user,
  } = useDashboard();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState<boolean>(true);

  // Fetch user's team role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!authUser?.id) return;

      try {
        setRoleLoading(true);
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
  }, [authUser?.id]);

  // Check if user can edit events
  const canEditEvents =
    userRole && ["team_admin", "event_manager"].includes(userRole);

  // Navigate to create event page when that section is selected
  useEffect(() => {
    if (activeSection === "create-event") {
      navigate("/events/create");
    }
  }, [activeSection, navigate]);

  // Navigate to edit event page
  const handleEditEvent = (eventId: number) => {
    navigate(`/events/${eventId}/edit`);
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

  return (
    <div className="pb-64 md:pb-44">
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-240px)]">
          <DashboardSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div className="flex-1 p-6 overflow-auto">
            <div className="pb-4 mb-6 border-b">
              <h1 className="text-2xl font-bold">Team Dashboard</h1>
              <p className="text-muted-foreground">Manage your team's events</p>
            </div>

            {/* Display either draft events or all events based on active section */}
            {activeSection === "draft-events" ? (
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
