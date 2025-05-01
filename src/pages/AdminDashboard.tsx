import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import usersApi from "@/api/users";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UsersIcon,
  CalendarIcon,
  Settings2Icon,
  HomeIcon,
  MessageSquareIcon,
  UserCogIcon,
  ShieldIcon,
} from "lucide-react";
import {
  UsersManagement,
  TeamsManagement,
  EventsManagement,
} from "@/components/admin";
import {
  AdminDashboardData,
  ExtractedTeamMember,
  StatsType,
} from "@/types/admin";

// Define types

interface SidebarItemType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Main AdminDashboard component
export default function AdminDashboard() {
  const {
    isSiteAdmin,
    isAuthenticated,
    checkSiteAdmin,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  // Define available dashboard sections
  const DASHBOARD_SECTIONS = {
    OVERVIEW: "overview",
    USERS: "users",
    TEAMS: "teams",
    EVENTS: "events",
    SETTINGS: "settings",
  };

  // Define sidebar menu items
  const sidebarItems: SidebarItemType[] = [
    {
      id: DASHBOARD_SECTIONS.OVERVIEW,
      label: "Overview",
      icon: <HomeIcon className="mr-2" />,
    },
    {
      id: DASHBOARD_SECTIONS.USERS,
      label: "Users",
      icon: <UsersIcon className="mr-2" />,
    },
    {
      id: DASHBOARD_SECTIONS.TEAMS,
      label: "Teams",
      icon: <UserCogIcon className="mr-2" />,
    },
    {
      id: DASHBOARD_SECTIONS.EVENTS,
      label: "Events",
      icon: <CalendarIcon className="mr-2" />,
    },
    {
      id: DASHBOARD_SECTIONS.SETTINGS,
      label: "Settings",
      icon: <Settings2Icon className="mr-2" />,
    },
  ];

  // State
  const [activeSection, setActiveSection] = useState<string>(
    DASHBOARD_SECTIONS.OVERVIEW
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData>({
    users: [],
    teams: [],
    teamMembers: [],
    events: [],
  });
  const [stats, setStats] = useState<StatsType>({
    users: 0,
    teams: 0,
    events: 0,
    teamMembers: 0,
  });

  // Verify admin access
  useEffect(() => {
    const verifyAccess = async () => {
      setLoading(true);

      // Wait for auth to finish loading before making navigation decisions
      if (authLoading) return;

      // Redirect if not authenticated
      if (!isAuthenticated) {
        navigate("/auth/login");
        return;
      }

      // Check admin status using the API endpoint
      await checkSiteAdmin();

      // If not admin after check, redirect to home
      if (!isSiteAdmin) {
        navigate("/");
        return;
      }

      setLoading(false);
    };

    verifyAccess();
  }, [isAuthenticated, isSiteAdmin, navigate, checkSiteAdmin, authLoading]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!loading && isSiteAdmin) {
          const response = await usersApi.getAdminDashboardData();
          const data = response.data?.data || {};

          // Process events - combine regular and draft events without duplicates
          const eventsMap = new Map();

          // Add regular events to map with id as key
          if (Array.isArray(data.events)) {
            data.events.forEach((event: any) => {
              eventsMap.set(event.id, event);
            });
          }

          // Add draft events to map, will override if same id exists
          if (Array.isArray(data.draft_events)) {
            data.draft_events.forEach((event: any) => {
              eventsMap.set(event.id, event);
            });
          }

          // Convert map values to array
          const allEvents = Array.from(eventsMap.values());

          // Extract team membership data from users
          const extractedTeamMembers: ExtractedTeamMember[] = [];
          if (Array.isArray(data.users)) {
            data.users.forEach((user: any) => {
              if (Array.isArray(user.teams)) {
                user.teams.forEach((team: any) => {
                  extractedTeamMembers.push({
                    userId: user.id,
                    teamId: team.team_id,
                    username: user.username,
                    email: user.email,
                    role: team.role,
                  });
                });
              }
            });
          }

          // Update dashboard data
          setDashboardData({
            users: Array.isArray(data.users) ? data.users : [],
            teams: Array.isArray(data.teams) ? data.teams : [],
            teamMembers: extractedTeamMembers as any,
            events: allEvents,
          });

          // Update stats
          setStats({
            users: data.total_users || 0,
            teams: data.total_teams || 0,
            events: allEvents.length,
            teamMembers: data.total_team_members || 0,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadDashboardData();
  }, [loading, isSiteAdmin]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isSiteAdmin) {
    return null;
  }

  // Render active section content
  const renderContent = () => {
    // Count published and draft events separately for the events management section
    const publishedEvents = dashboardData.events.filter(
      (event) => event.status === "published"
    );
    const draftEvents = dashboardData.events.filter(
      (event) => event.status === "draft"
    );

    // Select the appropriate component based on active section
    switch (activeSection) {
      case DASHBOARD_SECTIONS.OVERVIEW:
        return <AdminOverview stats={stats} />;
      case DASHBOARD_SECTIONS.USERS:
        return (
          <UsersManagement
            users={dashboardData.users}
            totalUsers={stats.users}
          />
        );
      case DASHBOARD_SECTIONS.TEAMS:
        return (
          <TeamsManagement
            teams={dashboardData.teams}
            teamMembers={dashboardData.teamMembers}
            totalTeams={stats.teams}
            totalTeamMembers={stats.teamMembers}
          />
        );
      case DASHBOARD_SECTIONS.EVENTS:
        return (
          <EventsManagement
            events={dashboardData.events}
            totalEvents={publishedEvents.length}
            draftEventsCount={draftEvents.length}
          />
        );
      case DASHBOARD_SECTIONS.SETTINGS:
        return <AdminSettings />;
      default:
        return <AdminOverview stats={stats} />;
    }
  };

  return (
    <div className="pb-64 md:pb-44">
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-240px)]">
          <Sidebar>
            <SidebarHeader>
              <div className="px-3 py-2">
                <h2 className="text-xl font-bold text-primary">
                  Admin Dashboard
                </h2>
                <p className="text-sm text-muted-foreground">Site Management</p>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          className="cursor-pointer"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <div className="px-3 py-2">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  Back to Site
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
        </div>
      </SidebarProvider>
    </div>
  );
}

// AdminOverview component for the Overview section
function AdminOverview({ stats }: { stats: StatsType }) {
  // Overview stat cards configuration
  const statCards = [
    {
      title: "User Stats",
      icon: <UsersIcon className="mr-2 h-5 w-5" />,
      value: stats.users,
      description: "Total registered users",
    },
    {
      title: "Teams",
      icon: <UserCogIcon className="mr-2 h-5 w-5" />,
      value: stats.teams,
      description: "Active teams",
    },
    {
      title: "Events",
      icon: <CalendarIcon className="mr-2 h-5 w-5" />,
      value: stats.events,
      description: "Total events",
    },
    {
      title: "Team Members",
      icon: <UsersIcon className="mr-2 h-5 w-5" />,
      value: stats.teamMembers,
      description: "Active team memberships",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Render stat cards */}
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              {card.icon}
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
            <p className="text-muted-foreground text-sm">{card.description}</p>
          </CardContent>
        </Card>
      ))}

      {/* Security status card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ShieldIcon className="mr-2 h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span>All systems operational</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Last security audit: 3 days ago
          </p>
        </CardContent>
      </Card>

      {/* Support card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MessageSquareIcon className="mr-2 h-5 w-5" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">8</div>
          <p className="text-muted-foreground text-sm">Open support tickets</p>
        </CardContent>
      </Card>
    </div>
  );
}

// AdminSettings component for the Settings section
function AdminSettings() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
      <p className="text-muted-foreground mb-6">
        Configure site-wide settings, security policies, and administrator
        access.
      </p>

      <Card>
        <CardContent className="pt-6">
          <p>Admin settings functionality coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
