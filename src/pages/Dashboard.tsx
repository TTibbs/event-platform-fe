import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  DashboardSidebar,
  DashboardOverview,
  DraftEventsList,
  AllEventsList,
  useDashboard,
} from "@/components/dashboard";
import { useEffect } from "react";

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

  // Navigate to create event page when that section is selected
  useEffect(() => {
    if (activeSection === "create-event") {
      navigate("/events/create");
    }
  }, [activeSection, navigate]);

  if (loading) {
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

            {/* Show content based on active section */}
            {activeSection !== "create-event" && (
              <>
                {(activeSection === "overview" ||
                  activeSection === "default") && (
                  <DashboardOverview
                    teamDraftEvents={teamDraftEvents}
                    teamEvents={teamEvents}
                    userId={user?.id}
                  />
                )}

                {activeSection === "draft-events" && (
                  <DraftEventsList
                    teamDraftEvents={teamDraftEvents}
                    userId={user?.id}
                  />
                )}

                {activeSection === "all-events" && (
                  <AllEventsList teamEvents={teamEvents} userId={user?.id} />
                )}
              </>
            )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
