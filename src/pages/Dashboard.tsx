import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  DashboardSidebar,
  DashboardOverview,
  DraftEventsList,
  AllEventsList,
  useDashboard,
} from "@/components/dashboard";

export default function Dashboard() {
  const {
    draftEvents,
    allEvents,
    loading,
    error,
    isTeamMember,
    activeSection,
    setActiveSection,
    user,
  } = useDashboard();
  const navigate = useNavigate();

  // If user isn't a team member, they'll be redirected by the useDashboard hook
  // This is just a fallback
  if (!isTeamMember && !loading) {
    return null;
  }

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

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <DashboardOverview
            draftEvents={draftEvents}
            allEvents={allEvents}
            userId={user?.id}
          />
        );
      case "draft-events":
        return <DraftEventsList events={draftEvents} userId={user?.id} />;
      case "all-events":
        return <AllEventsList events={allEvents} userId={user?.id} />;
      case "create-event":
        navigate("/events/create");
        return null;
      default:
        return (
          <DashboardOverview
            draftEvents={draftEvents}
            allEvents={allEvents}
            userId={user?.id}
          />
        );
    }
  };

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

            {renderContent()}
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
