import { useState, useEffect } from "react";
import eventsApi from "@/api/events";
import teamsApi from "@/api/teams";
import { EventCard } from "@/components/events/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Event } from "@/types/events";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Pencil, FilePlus, Calendar, FileText, Home } from "lucide-react";

export default function Dashboard() {
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is a member of any team
  useEffect(() => {
    const checkTeamMembership = async () => {
      if (!user?.id) return;

      try {
        const response = await teamsApi.getMemberByUserId(user.id.toString());
        // If we get a successful response, the user is a team member
        setIsTeamMember(!!response.data);
      } catch (err) {
        // If we get an error, user is not a team member
        setIsTeamMember(false);
        // Redirect non-team members to profile page
        navigate("/profile");
      }
    };

    checkTeamMembership();
  }, [user, navigate]);

  useEffect(() => {
    const fetchDraftEvents = async () => {
      if (!isTeamMember) return; // Skip fetching draft events for non-team members

      setLoading(true);
      try {
        const response = await eventsApi.getDraftEvents();
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
  }, [isTeamMember]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!isTeamMember) return; // Skip fetching if not a team member

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

  // If user isn't a team member, they'll be redirected by the useEffect
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
        <p>{error.message || "Failed to load draft events"}</p>
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
      case "manage-events":
        navigate("/events");
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
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="px-3 py-2">
              <h2 className="text-xl font-bold text-primary">Team Dashboard</h2>
              <p className="text-sm text-muted-foreground">Event Management</p>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "overview"}
                      onClick={() => setActiveSection("overview")}
                      className="cursor-pointer"
                    >
                      <Home className="mr-2" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "draft-events"}
                      onClick={() => setActiveSection("draft-events")}
                      className="cursor-pointer"
                    >
                      <FileText className="mr-2" />
                      <span>Draft Events</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "all-events"}
                      onClick={() => setActiveSection("all-events")}
                      className="cursor-pointer"
                    >
                      <Calendar className="mr-2" />
                      <span>All Events</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("create-event")}
                      className="cursor-pointer"
                    >
                      <FilePlus className="mr-2" />
                      <span>Create New Event</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("manage-events")}
                      className="cursor-pointer"
                    >
                      <Pencil className="mr-2" />
                      <span>Manage & Edit Events</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="px-3 py-2">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                My Profile
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 p-6 overflow-auto">
          <div className="pb-4 mb-6 border-b">
            <h1 className="text-2xl font-bold">Team Dashboard</h1>
            <p className="text-muted-foreground">Manage your team's events</p>
          </div>

          {renderContent()}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Component to show both draft and all events (overview)
function DashboardOverview({
  draftEvents,
  allEvents,
  userId,
}: {
  draftEvents: Event[];
  allEvents: Event[];
  userId?: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Draft Events</h2>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate("/events/create")}
          >
            Create New Event
          </Button>
        </div>

        {draftEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftEvents.map((event) => (
              <EventCard key={event.id} event={event} userId={userId} />
            ))}
          </div>
        ) : (
          <div className="bg-muted border border-border rounded-md p-8 text-center">
            <p className="text-muted-foreground mb-4">
              You don't have any draft events.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} userId={userId} />
          ))}
        </div>
        {allEvents.length > 3 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate("/events")}>
              View All Events
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

// Component to show only draft events
function DraftEventsList({
  events,
  userId,
}: {
  events: Event[];
  userId?: number;
}) {
  const navigate = useNavigate();

  return (
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

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} userId={userId} />
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
  );
}

// Component to show all events
function AllEventsList({
  events,
  userId,
}: {
  events: Event[];
  userId?: number;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">All Events</h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} userId={userId} />
          ))}
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-md p-8 text-center">
          <p className="text-muted-foreground mb-4">No events found.</p>
        </div>
      )}
    </div>
  );
}
