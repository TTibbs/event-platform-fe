import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Menu,
  X,
  User,
  Calendar,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import teamsApi from "@/api/teams";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);

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
    };

    if (isAuthenticated) {
      initHeader();
    }
  }, [user, isAuthenticated, checkSiteAdmin]);

  // Generate avatar fallback from username
  const getAvatarFallback = () => {
    if (!user?.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
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

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {isTeamMember && (
                    <Button variant="ghost" className="cursor-pointer" asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                  {isSiteAdmin && (
                    <Button variant="ghost" className="cursor-pointer" asChild>
                      <Link to="/admin">Admin</Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="cursor-pointer" asChild>
                    <Link to="/events">Events</Link>
                  </Button>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      Logout
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
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
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="cursor-pointer" asChild>
                    <Link to="/auth/login">Login</Link>
                  </Button>
                  <Button className="cursor-pointer" asChild>
                    <Link to="/auth/signup">Sign Up</Link>
                  </Button>
                  <ThemeToggle />
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
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
                        <Link to="/events" className="flex items-center w-full">
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
              ) : (
                <ThemeToggle />
              )}
              <button
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                className="p-2 rounded-md hover:bg-muted cursor-pointer"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden backdrop-blur-md bg-background/95 absolute w-full border-b border-border">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start cursor-pointer"
                  asChild
                >
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                </Button>
                {isTeamMember && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    asChild
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </Button>
                )}
                {isSiteAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    asChild
                  >
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start cursor-pointer"
                  asChild
                >
                  <Link to="/events" onClick={() => setIsMobileMenuOpen(false)}>
                    Events
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start cursor-pointer text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start cursor-pointer"
                  asChild
                >
                  <Link
                    to="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </Button>
                <Button className="w-full cursor-pointer" asChild>
                  <Link
                    to="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
