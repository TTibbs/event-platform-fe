import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import usersApi from "@/api/users";
import { User } from "@/types/users";
import { TeamResponse, TeamMember } from "@/types/teams";
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

interface AdminDashboardData {
  users: User[];
  teams: TeamResponse[];
  teamMembers: TeamMember[];
  events: Event[];
}

interface ExtractedTeamMember {
  userId: number;
  teamId: number;
  username: string;
  email: string;
  role: string;
}

interface StatsType {
  users: number;
  teams: number;
  events: number;
  teamMembers: number;
}

export default function AdminDashboard() {
  const {
    isSiteAdmin,
    isAuthenticated,
    checkSiteAdmin,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("overview");
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

  // Load dashboard data from consolidated API endpoint
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (!loading && isSiteAdmin) {
          const response = await usersApi.getAdminDashboardData();

          // The actual data is nested under response.data.data
          const data = response.data?.data || {};

          // Combine regular and draft events
          const allEvents = [
            ...(Array.isArray(data.events) ? data.events : []),
            ...(Array.isArray(data.draft_events) ? data.draft_events : []),
          ];

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

          setDashboardData({
            users: Array.isArray(data.users) ? data.users : [],
            teams: Array.isArray(data.teams) ? data.teams : [],
            teamMembers: extractedTeamMembers as any, // Cast to match expected type
            events: allEvents,
          });

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

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!isSiteAdmin) {
    return null; // Don't render anything if not admin
  }

  const renderContent = () => {
    // Count published and draft events separately for the events management section
    const publishedEvents = dashboardData.events.filter(
      (event) => event.status === "published"
    );
    const draftEvents = dashboardData.events.filter(
      (event) => event.status === "draft"
    );

    // Map each section to its component with appropriate props
    const sections = {
      overview: <AdminOverview stats={stats} />,
      users: (
        <UsersManagement users={dashboardData.users} totalUsers={stats.users} />
      ),
      teams: (
        <TeamsManagement
          teams={dashboardData.teams}
          teamMembers={dashboardData.teamMembers}
          totalTeams={stats.teams}
          totalTeamMembers={stats.teamMembers}
        />
      ),
      events: (
        <EventsManagement
          events={dashboardData.events}
          totalEvents={publishedEvents.length}
          draftEventsCount={draftEvents.length}
        />
      ),
      settings: <AdminSettings />,
    };

    return (
      sections[activeSection as keyof typeof sections] || sections.overview
    );
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
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "overview"}
                        onClick={() => setActiveSection("overview")}
                        className="cursor-pointer"
                      >
                        <HomeIcon className="mr-2" />
                        <span>Overview</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "users"}
                        onClick={() => setActiveSection("users")}
                        className="cursor-pointer"
                      >
                        <UsersIcon className="mr-2" />
                        <span>Users</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "teams"}
                        onClick={() => setActiveSection("teams")}
                        className="cursor-pointer"
                      >
                        <UserCogIcon className="mr-2" />
                        <span>Teams</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "events"}
                        onClick={() => setActiveSection("events")}
                        className="cursor-pointer"
                      >
                        <CalendarIcon className="mr-2" />
                        <span>Events</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeSection === "settings"}
                        onClick={() => setActiveSection("settings")}
                        className="cursor-pointer"
                      >
                        <Settings2Icon className="mr-2" />
                        <span>Settings</span>
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

// Updated components for different sections of the admin dashboard
function AdminOverview({ stats }: { stats: StatsType }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            User Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.users}</div>
          <p className="text-muted-foreground text-sm">
            Total registered users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <UserCogIcon className="mr-2 h-5 w-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.teams}</div>
          <p className="text-muted-foreground text-sm">Active teams</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.events}</div>
          <p className="text-muted-foreground text-sm">Total events</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.teamMembers}</div>
          <p className="text-muted-foreground text-sm">
            Active team memberships
          </p>
        </CardContent>
      </Card>

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
