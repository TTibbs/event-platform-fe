import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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

export default function AdminDashboard() {
  const { user, isSiteAdmin, isAuthenticated, checkSiteAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      setLoading(true);

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
  }, [isAuthenticated, isSiteAdmin, navigate, checkSiteAdmin]);

  if (loading) {
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
        return <AdminOverview />;
      case "users":
        return <UsersManagement />;
      case "teams":
        return <TeamsManagement />;
      case "events":
        return <EventsManagement />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
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
                    >
                      <HomeIcon className="mr-2" />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "users"}
                      onClick={() => setActiveSection("users")}
                    >
                      <UsersIcon className="mr-2" />
                      <span>Users</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "teams"}
                      onClick={() => setActiveSection("teams")}
                    >
                      <UserCogIcon className="mr-2" />
                      <span>Teams</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "events"}
                      onClick={() => setActiveSection("events")}
                    >
                      <CalendarIcon className="mr-2" />
                      <span>Events</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeSection === "settings"}
                      onClick={() => setActiveSection("settings")}
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
                className="w-full"
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

// Placeholder components for different sections of the admin dashboard
function AdminOverview() {
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
          <div className="text-3xl font-bold">357</div>
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
          <div className="text-3xl font-bold">42</div>
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
          <div className="text-3xl font-bold">128</div>
          <p className="text-muted-foreground text-sm">
            Events created this month
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

function UsersManagement() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Users Management</h2>
      <p className="text-muted-foreground mb-6">
        This section will contain user management functionality including
        listing users, editing user details, and managing user permissions.
      </p>

      <Card>
        <CardContent className="pt-6">
          <p>User management functionality coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamsManagement() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Teams Management</h2>
      <p className="text-muted-foreground mb-6">
        This section will contain team management functionality including
        creating teams, editing team details, and managing team members.
      </p>

      <Card>
        <CardContent className="pt-6">
          <p>Team management functionality coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EventsManagement() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Events Management</h2>
      <p className="text-muted-foreground mb-6">
        This section will allow administrators to oversee all events, manage
        event approvals, and handle event-related issues.
      </p>

      <Card>
        <CardContent className="pt-6">
          <p>Event management functionality coming soon.</p>
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
