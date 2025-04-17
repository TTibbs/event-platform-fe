import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, User, Calendar, LayoutDashboard, LogOut } from "lucide-react";
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
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);

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
      }
    };

    if (isAuthenticated) {
      checkTeamMembership();
    }
  }, [user, isAuthenticated]);

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
                    <Link
                      to="/dashboard"
                      className="text-sm font-medium hover:text-primary"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/events"
                    className="text-sm font-medium hover:text-primary"
                  >
                    Events
                  </Link>
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={handleLogout}>
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
                            className="py-2 hover:bg-muted rounded-md cursor-pointer"
                          >
                            <Link to="/profile" className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          {isTeamMember && (
                            <DropdownMenuItem
                              asChild
                              className="py-2 hover:bg-muted rounded-md cursor-pointer"
                            >
                              <Link
                                to="/dashboard"
                                className="flex items-center"
                              >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            asChild
                            className="py-2 hover:bg-muted rounded-md cursor-pointer"
                          >
                            <Link to="/events" className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Events
                            </Link>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <ThemeToggle
                            showLabel={true}
                            className="rounded-md"
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
                  <Link to="/auth/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
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
                        className="py-2 hover:bg-muted rounded-md cursor-pointer"
                      >
                        <Link to="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      {isTeamMember && (
                        <DropdownMenuItem
                          asChild
                          className="py-2 hover:bg-muted rounded-md cursor-pointer"
                        >
                          <Link to="/dashboard" className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                        className="py-2 hover:bg-muted rounded-md cursor-pointer"
                      >
                        <Link to="/events" className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Events
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <ThemeToggle showLabel={true} className="rounded-md" />
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
              <button onClick={toggleMobileMenu} aria-label="Toggle menu">
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
                <div className="flex items-center space-x-3 pb-3">
                  <Avatar>
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{user?.username}</div>
                </div>
                <div className="grid gap-2">
                  {isTeamMember && (
                    <Link
                      to="/dashboard"
                      className="block py-2 px-3 rounded-md hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/events"
                    className="block py-2 px-3 rounded-md hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link
                    to="/profile"
                    className="block py-2 px-3 rounded-md hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start px-3"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Link
                  to="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
