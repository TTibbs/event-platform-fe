import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { isAuthenticated, user, logout, isSiteAdmin, checkSiteAdmin } =
    useAuth();
  const [isTeamMember, setIsTeamMember] = useState<boolean>(false);
  const [currentUserData, setCurrentUserData] = useState(user);
  const location = useLocation();

  useEffect(() => {
    const initHeader = async () => {
      if (!user?.id) return;

      // Check for site admin status
      await checkSiteAdmin();

      // Check team membership
      try {
        const teamResponse = await teamsApi.getMemberByUserId(
          user.id.toString()
        );
        setIsTeamMember(!!teamResponse.data);
      } catch (err) {
        console.error("Error checking team membership:", err);
        setIsTeamMember(false);
      }

      // Fetch latest user data to ensure profile image is up-to-date
      try {
        const userResponse = await usersApi.getUserById(user.id.toString());
        setCurrentUserData(userResponse.data.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setCurrentUserData(user);
      }
    };

    if (isAuthenticated) {
      initHeader();
    }
  }, [user, isAuthenticated, checkSiteAdmin, location.pathname]);

  // Generate avatar fallback from username
  const getAvatarFallback = () => {
    if (!currentUserData?.username) return "U";
    return currentUserData.username.substring(0, 2).toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass morphism effect */}
      <div className="backdrop-blur-md bg-background/70 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary">
                EventsApp
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:block">
                    {isTeamMember && (
                      <Button
                        variant="ghost"
                        className="cursor-pointer"
                        asChild
                      >
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    )}
                    {isSiteAdmin && (
                      <Button
                        variant="ghost"
                        className="cursor-pointer"
                        asChild
                      >
                        <Link to="/admin">Admin</Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="cursor-pointer" asChild>
                      <Link to="/events">Events</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      Logout
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        {currentUserData?.profile_image_url && (
                          <AvatarImage
                            src={currentUserData.profile_image_url}
                            alt={currentUserData.username || "User"}
                          />
                        )}
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="font-bold py-2 text-center border-b text-primary">
                        My Account
                      </DropdownMenuLabel>
                      <div className="p-2">
                        <DropdownMenuItem
                          asChild
                          className="py-2 hover:bg-primary/10 rounded-md cursor-pointer"
                        >
                          <Link
                            to="/profile"
                            className="flex items-center w-full"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        {isTeamMember && (
                          <DropdownMenuItem
                            asChild
                            className="py-2 hover:bg-primary/10 rounded-md cursor-pointer"
                          >
                            <Link
                              to="/dashboard"
                              className="flex items-center w-full"
                            >
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isSiteAdmin && (
                          <DropdownMenuItem
                            asChild
                            className="py-2 hover:bg-primary/10 rounded-md cursor-pointer"
                          >
                            <Link
                              to="/admin"
                              className="flex items-center w-full"
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          asChild
                          className="py-2 hover:bg-primary/10 rounded-md cursor-pointer"
                        >
                          <Link
                            to="/events"
                            className="flex items-center w-full"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Events
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <ThemeToggle
                          showLabel={true}
                          className="rounded-md w-full"
                        />
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="py-2 hover:bg-destructive/10 rounded-md cursor-pointer"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center space-x-4">
                    <Button variant="ghost" className="cursor-pointer" asChild>
                      <Link to="/auth/login">Login</Link>
                    </Button>
                    <Button className="cursor-pointer" asChild>
                      <Link to="/auth/signup">Sign Up</Link>
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="md:hidden">
                        <User className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="p-2 space-y-2">
                        <DropdownMenuItem
                          asChild
                          className="py-2 hover:bg-primary/10 rounded-md cursor-pointer"
                        >
                          <Link to="/auth/login" className="w-full">
                            Login
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
                        >
                          <Link to="/auth/signup" className="w-full">
                            Sign Up
                          </Link>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ThemeToggle />
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
