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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  CalendarIcon,
  Settings2Icon,
  HomeIcon,
  MessageSquareIcon,
  UserCogIcon,
  ShieldIcon,
  EyeIcon,
  Pencil,
  Trash2,
  Calendar,
  UserPlus,
  Plus,
} from "lucide-react";

// Define the admin dashboard data structure
interface AdminDashboardData {
  users: User[];
  teams: TeamResponse[];
  teamMembers: TeamMember[];
  events: Event[];
}

// Define a new interface to match the team member data we'll extract
interface ExtractedTeamMember {
  userId: number;
  teamId: number;
  username: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const {
    isSiteAdmin,
    isAuthenticated,
    checkSiteAdmin,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData>({
    users: [],
    teams: [],
    teamMembers: [],
    events: [],
  });
  const [stats, setStats] = useState({
    users: 0,
    teams: 0,
    events: 0,
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
    switch (activeSection) {
      case "overview":
        return <AdminOverview stats={stats} />;
      case "users":
        return <UsersManagement users={dashboardData.users} />;
      case "teams":
        return (
          <TeamsManagement
            teams={dashboardData.teams}
            teamMembers={dashboardData.teamMembers}
          />
        );
      case "events":
        return <EventsManagement events={dashboardData.events} />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview stats={stats} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
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

        <div className="flex-1 p-6 overflow-auto">
          <div className="pb-4 mb-6 border-b">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Site administration and management
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Updated components for different sections of the admin dashboard
function AdminOverview({
  stats,
}: {
  stats: { users: number; teams: number; events: number };
}) {
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

function UsersManagement({ users }: { users: User[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Users Management</h2>
          <p className="text-muted-foreground">
            Manage site users and their permissions
          </p>
        </div>
        <Button className="cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.is_site_admin ? (
                          <Badge className="bg-primary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View User"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit User"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamsManagement({
  teams,
  teamMembers,
}: {
  teams: TeamResponse[];
  teamMembers: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTeamMembersCount = (teamId: number) => {
    return teamMembers.filter((member) => member.teamId === teamId).length;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Teams Management</h2>
          <p className="text-muted-foreground">
            Manage teams and their members
          </p>
        </div>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No teams found
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>{team.id}</TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {team.description || (
                          <span className="text-muted-foreground italic">
                            No description
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getTeamMembersCount(team.id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(team.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View Team"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit Team"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete Team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EventsManagement({ events }: { events: Event[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Events Management</h2>
          <p className="text-muted-foreground">
            Manage all events on the platform
          </p>
        </div>
        <Button className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.id}</TableCell>
                      <TableCell className="font-medium">
                        {event.title}
                      </TableCell>
                      <TableCell>{event.team_name}</TableCell>
                      <TableCell>{formatDate(event.start_time)}</TableCell>
                      <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                      <TableCell>{event.creator_username}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View Event"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit Event"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
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
